<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';

use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

function vaccJson(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function vaccVetId(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare('SELECT vet_id FROM veterinarians WHERE user_id = :user_id LIMIT 1');
    $stmt->execute([':user_id' => $userId]);
    return (int)$stmt->fetchColumn();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $pet_id = isset($_GET['pet_id']) ? (int)$_GET['pet_id'] : 0;

        $sql = 'SELECT v.*, 
                       vet.full_name AS vet_name, 
                       p.pet_name,
                       prod.product_name,
                       prod.manufacturer,
                       prod.expiry_date as product_expiry,
                       CASE 
                           WHEN v.next_due_date < CURDATE() THEN "overdue"
                           WHEN v.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN "due_soon"
                           ELSE "current"
                       END as due_status
                FROM vaccinations v
                LEFT JOIN veterinarians vet ON v.adminstered_vet_id = vet.vet_id
                LEFT JOIN pets p ON v.pet_id = p.pet_id
                LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
                LEFT JOIN vaccination_products prod ON v.product_id = prod.product_id
                WHERE 1 = 1';
        $params = [];
        if ($pet_id > 0) {
            $sql .= ' AND v.pet_id = :pet_id';
            $params[':pet_id'] = $pet_id;
        }
        if ($auth['role'] === 'PetOwner') {
            $sql .= ' AND po.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        } elseif ($auth['role'] === 'Veterinarian') {
            $vetId = vaccVetId($pdo, $auth['user_id']);
            $sql .= ' AND (v.adminstered_vet_id = :vet_id OR v.adminstered_vet_id IS NULL)';
            $params[':vet_id'] = $vetId;
        }

        $stmt = $pdo->prepare($sql . ' ORDER BY v.date DESC');
        $stmt->execute($params);
        $records = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $records]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        AuthGuard::checkRoles(['Admin', 'Veterinarian']);

        $data = vaccJson();
        if ($auth['role'] === 'Veterinarian') {
            $data['adminstered_vet_id'] = vaccVetId($pdo, $auth['user_id']);
        }

        $required = ['pet_id', 'adminstered_vet_id', 'vaccine_name', 'date'];
        foreach ($required as $r) {
            if (empty($data[$r])) {
                echo json_encode(['success' => false, 'message' => "Missing field: $r"]);
                exit;
            }
        }

        $stmt = $pdo->prepare('INSERT INTO vaccinations (pet_id, adminstered_vet_id, vaccine_name, date, next_due_date, reaction_noted, product_id, batch_number, notes) VALUES (:pet_id, :vet_id, :vaccine_name, :date, :next_due_date, :reaction_noted, :product_id, :batch_number, :notes)');
        $stmt->execute([
            ':pet_id' => $data['pet_id'],
            ':vet_id' => $data['adminstered_vet_id'],
            ':vaccine_name' => $data['vaccine_name'],
            ':date' => $data['date'],
            ':next_due_date' => $data['next_due_date'] ?? null,
            ':reaction_noted' => $data['reaction_noted'] ?? null,
            ':product_id' => $data['product_id'] ?? null,
            ':batch_number' => $data['batch_number'] ?? null,
            ':notes' => $data['notes'] ?? null,
        ]);

        $id = (int)$pdo->lastInsertId();
        echo json_encode(['success' => true, 'vaccine_record_id' => $id]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        AuthGuard::checkRoles(['Admin', 'Veterinarian']);
        $data = vaccJson();

        if (empty($data['vaccine_record_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing vaccine_record_id']);
            exit;
        }

        $updates = [];
        $params = [':id' => (int)$data['vaccine_record_id']];

        $updatable = ['vaccine_name', 'next_due_date', 'reaction_noted', 'product_id', 'batch_number', 'notes'];
        foreach ($updatable as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            exit;
        }

        $sql = 'UPDATE vaccinations SET ' . implode(', ', $updates) . ' WHERE vaccine_record_id = :id';
        $stmt = $pdo->prepare($sql);
        if ($stmt->execute($params)) {
            echo json_encode(['success' => true, 'message' => 'Vaccination record updated']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update record']);
        }
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        AuthGuard::checkRoles(['Admin', 'Veterinarian']);
        parse_str(file_get_contents('php://input'), $data);

        if (empty($data['vaccine_record_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing vaccine_record_id']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM vaccinations WHERE vaccine_record_id = :id');
        if ($stmt->execute([':id' => (int)$data['vaccine_record_id']])) {
            echo json_encode(['success' => true, 'message' => 'Vaccination record deleted']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete record']);
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    exit;
}
