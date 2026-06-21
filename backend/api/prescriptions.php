<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';

use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

function prescriptionJson(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $record_id = isset($_GET['record_id']) ? (int)$_GET['record_id'] : 0;
        
        if ($record_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Missing record_id']);
            exit;
        }

        $sql = 'SELECT pr.*, COUNT(pi.item_id) as item_count
                FROM prescriptions pr
                LEFT JOIN prescription_items pi ON pr.prescription_id = pi.prescription_id
                INNER JOIN health_records hr ON pr.record_id = hr.record_id
                INNER JOIN pets p ON hr.pet_id = p.pet_id
                INNER JOIN pet_owners po ON p.owner_id = po.owner_id
                LEFT JOIN veterinarians v ON hr.vet_id = v.vet_id
                WHERE pr.record_id = :record_id';
        $params = [':record_id' => $record_id];
        if ($auth['role'] === 'PetOwner') {
            $sql .= ' AND po.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        } elseif ($auth['role'] === 'Veterinarian') {
            $sql .= ' AND v.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        }

        $stmt = $pdo->prepare($sql . ' GROUP BY pr.prescription_id ORDER BY pr.issue_date DESC');
        $stmt->execute($params);
        $prescriptions = $stmt->fetchAll();

        // Get items for each prescription
        $result = [];
        foreach ($prescriptions as $presc) {
            $itemStmt = $pdo->prepare('SELECT item_id, drug_name, dosage, frequency FROM prescription_items WHERE prescription_id = :id');
            $itemStmt->execute([':id' => $presc['prescription_id']]);
            $presc['items'] = $itemStmt->fetchAll();
            $result[] = $presc;
        }

        echo json_encode(['success' => true, 'data' => $result]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        AuthGuard::checkRoles(['Admin', 'Veterinarian']);
        $data = prescriptionJson();

        $required = ['record_id'];
        foreach ($required as $r) {
            if (empty($data[$r])) {
                echo json_encode(['success' => false, 'message' => "Missing field: $r"]);
                exit;
            }
        }

        if ($auth['role'] === 'Veterinarian') {
            $recordStmt = $pdo->prepare(
                'SELECT hr.record_id
                 FROM health_records hr
                 INNER JOIN veterinarians v ON hr.vet_id = v.vet_id
                 WHERE hr.record_id = :record_id AND v.user_id = :user_id'
            );
            $recordStmt->execute([':record_id' => (int)$data['record_id'], ':user_id' => $auth['user_id']]);
            if (!$recordStmt->fetchColumn()) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You can prescribe only for your own health records']);
                exit;
            }
        }

        // Create prescription
        $stmt = $pdo->prepare('INSERT INTO prescriptions (record_id, issue_date) VALUES (:record_id, :issue_date)');
        $stmt->execute([
            ':record_id' => $data['record_id'],
            ':issue_date' => $data['issue_date'] ?? date('Y-m-d H:i:s'),
        ]);

        $prescription_id = (int)$pdo->lastInsertId();

        // Add prescription items if provided
        if (!empty($data['items']) && is_array($data['items'])) {
            $itemStmt = $pdo->prepare('INSERT INTO prescription_items (prescription_id, drug_name, dosage, frequency) VALUES (:presc_id, :drug_name, :dosage, :frequency)');
            foreach ($data['items'] as $item) {
                $itemStmt->execute([
                    ':presc_id' => $prescription_id,
                    ':drug_name' => $item['drug_name'] ?? '',
                    ':dosage' => $item['dosage'] ?? '',
                    ':frequency' => $item['frequency'] ?? '',
                ]);
            }
        }

        echo json_encode(['success' => true, 'prescription_id' => $prescription_id]);
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
