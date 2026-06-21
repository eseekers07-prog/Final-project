<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';
use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

function healthJson(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function healthVetId(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare('SELECT vet_id FROM veterinarians WHERE user_id = :user_id LIMIT 1');
    $stmt->execute([':user_id' => $userId]);
    return (int)$stmt->fetchColumn();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $pet_id = isset($_GET['pet_id']) ? (int)$_GET['pet_id'] : 0;
        if ($pet_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Missing pet_id']);
            exit;
        }

        $sql = 'SELECT hr.*, v.full_name AS vet_name, p.pet_name
                FROM health_records hr
                LEFT JOIN veterinarians v ON hr.vet_id = v.vet_id
                LEFT JOIN pets p ON hr.pet_id = p.pet_id
                LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
                WHERE hr.pet_id = :pet_id';
        $params = [':pet_id' => $pet_id];

        if ($auth['role'] === 'PetOwner') {
            $sql .= ' AND po.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        }

        $stmt = $pdo->prepare($sql . ' ORDER BY hr.visit_date DESC');
        $stmt->execute($params);
        $records = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $records]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        AuthGuard::checkRoles(['Admin', 'Veterinarian']);
        $data = healthJson();

        if ($auth['role'] === 'Veterinarian') {
            $data['vet_id'] = healthVetId($pdo, $auth['user_id']);
        }

        $required = ['pet_id', 'vet_id', 'clinical_finding'];
        foreach ($required as $r) {
            if (empty($data[$r])) {
                echo json_encode(['success' => false, 'message' => "Missing field: $r"]);
                exit;
            }
        }

        $stmt = $pdo->prepare('INSERT INTO health_records (pet_id, vet_id, appointment_id, visit_date, clinical_finding, diagnosis_code, treatment_plan, lab_results) VALUES (:pet_id, :vet_id, :appointment_id, :visit_date, :clinical_finding, :diagnosis_code, :treatment_plan, :lab_results)');
        $stmt->execute([
            ':pet_id' => $data['pet_id'],
            ':vet_id' => $data['vet_id'],
            ':appointment_id' => $data['appointment_id'] ?? null,
            ':visit_date' => $data['visit_date'] ?? date('Y-m-d H:i:s'),
            ':clinical_finding' => $data['clinical_finding'],
            ':diagnosis_code' => $data['diagnosis_code'] ?? null,
            ':treatment_plan' => $data['treatment_plan'] ?? null,
            ':lab_results' => $data['lab_results'] ?? null,
        ]);

        $id = (int)$pdo->lastInsertId();
        echo json_encode(['success' => true, 'record_id' => $id]);
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
