<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';
use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

function appointmentJson(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function currentOwnerId(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare('SELECT owner_id FROM pet_owners WHERE user_id = :user_id LIMIT 1');
    $stmt->execute([':user_id' => $userId]);
    return (int)$stmt->fetchColumn();
}

function currentVetId(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare('SELECT vet_id FROM veterinarians WHERE user_id = :user_id LIMIT 1');
    $stmt->execute([':user_id' => $userId]);
    return (int)$stmt->fetchColumn();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $sql = 'SELECT a.*, v.full_name AS vet_name, p.pet_name, po.full_name AS owner_name
                FROM appointments a
                LEFT JOIN veterinarians v ON a.vet_id = v.vet_id
                LEFT JOIN pets p ON a.pet_id = p.pet_id
                LEFT JOIN pet_owners po ON p.owner_id = po.owner_id';
        $params = [];

        if ($auth['role'] === 'PetOwner') {
            $sql .= ' WHERE po.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        } elseif ($auth['role'] === 'Veterinarian') {
            $sql .= ' WHERE v.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        }

        $stmt = $pdo->prepare($sql . ' ORDER BY a.scheduled_date DESC');
        $stmt->execute($params);
        $appointments = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $appointments]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = appointmentJson();

        if (($data['action'] ?? '') === 'update_status') {
            AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);
            $appointmentId = (int)($data['appointment_id'] ?? 0);
            $status = (string)($data['status'] ?? '');
            if ($appointmentId <= 0 || !in_array($status, ['scheduled', 'completed', 'cancelled'], true)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Invalid appointment status update']);
                exit;
            }

            $params = [':status' => $status, ':appointment_id' => $appointmentId];
            $sql = 'UPDATE appointments SET status = :status WHERE appointment_id = :appointment_id';
            if ($auth['role'] === 'Veterinarian') {
                $vetId = currentVetId($pdo, $auth['user_id']);
                $sql .= ' AND vet_id = :vet_id';
                $params[':vet_id'] = $vetId;
            } elseif ($auth['role'] === 'PetOwner') {
                if ($status !== 'cancelled') {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Pet owners can only cancel appointments']);
                    exit;
                }
                $ownerId = currentOwnerId($pdo, $auth['user_id']);
                $sql .= ' AND pet_id IN (SELECT pet_id FROM pets WHERE owner_id = :owner_id) AND status = :current_status';
                $params[':owner_id'] = $ownerId;
                $params[':current_status'] = 'scheduled';
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => $stmt->rowCount() > 0, 'message' => $stmt->rowCount() > 0 ? 'Appointment updated' : 'Appointment not found']);
            exit;
        }

        AuthGuard::checkRoles(['Admin', 'PetOwner']);

        $required = ['vet_id', 'pet_id', 'scheduled_date', 'type'];
        foreach ($required as $r) {
            if (empty($data[$r])) {
                echo json_encode(['success' => false, 'message' => "Missing field: $r"]);
                exit;
            }
        }

        if ($auth['role'] === 'PetOwner') {
            $ownerId = currentOwnerId($pdo, $auth['user_id']);
            $petStmt = $pdo->prepare('SELECT pet_id FROM pets WHERE pet_id = :pet_id AND owner_id = :owner_id');
            $petStmt->execute([':pet_id' => (int)$data['pet_id'], ':owner_id' => $ownerId]);
            if (!$petStmt->fetchColumn()) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You can book appointments only for your own pets']);
                exit;
            }
            unset($data['fee'], $data['status']);
        }

        $stmt = $pdo->prepare('INSERT INTO appointments (vet_id, pet_id, scheduled_date, type, status, resone, fee) VALUES (:vet_id, :pet_id, :scheduled_date, :type, :status, :resone, :fee)');
        $stmt->execute([
            ':vet_id' => $data['vet_id'],
            ':pet_id' => $data['pet_id'],
            ':scheduled_date' => $data['scheduled_date'],
            ':type' => $data['type'],
            ':status' => $data['status'] ?? 'scheduled',
            ':resone' => $data['resone'] ?? null,
            ':fee' => $data['fee'] ?? 0.00,
        ]);

        $id = (int)$pdo->lastInsertId();
        echo json_encode(['success' => true, 'appointment_id' => $id]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}
