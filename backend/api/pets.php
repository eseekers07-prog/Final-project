<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';
use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($auth['role'] === 'PetOwner') {
            $stmt = $pdo->prepare('SELECT p.*, po.full_name AS owner_name FROM pets p JOIN pet_owners po ON p.owner_id = po.owner_id WHERE po.user_id = :user_id ORDER BY p.created_at DESC');
            $stmt->execute([':user_id' => $auth['user_id']]);
        } else {
            $stmt = $pdo->prepare('SELECT p.*, po.full_name AS owner_name FROM pets p JOIN pet_owners po ON p.owner_id = po.owner_id ORDER BY p.created_at DESC');
            $stmt->execute();
        }
        $pets = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $pets]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        AuthGuard::checkRoles(['Admin', 'PetOwner']);
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        $required = $auth['role'] === 'Admin' ? ['owner_id', 'pet_name', 'species'] : ['pet_name', 'species'];
        foreach ($required as $r) {
            if (empty($data[$r])) {
                echo json_encode(['success' => false, 'message' => "Missing field: $r"]);
                exit;
            }
        }

        if ($auth['role'] === 'PetOwner') {
            $ownerStmt = $pdo->prepare('SELECT owner_id FROM pet_owners WHERE user_id = :user_id LIMIT 1');
            $ownerStmt->execute([':user_id' => $auth['user_id']]);
            $owner = $ownerStmt->fetch();
            if (!$owner) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Pet owner profile not found']);
                exit;
            }
            $data['owner_id'] = (int)$owner['owner_id'];
        }

        $stmt = $pdo->prepare('INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, sex, weight, microchip_number, known_allergies, photo_url) VALUES (:owner_id, :pet_name, :species, :breed, :date_of_birth, :sex, :weight, :microchip_number, :known_allergies, :photo_url)');
        $stmt->execute([
            ':owner_id' => $data['owner_id'],
            ':pet_name' => $data['pet_name'],
            ':species' => $data['species'],
            ':breed' => $data['breed'] ?? null,
            ':date_of_birth' => $data['date_of_birth'] ?? null,
            ':sex' => $data['sex'] ?? 'Unknown',
            ':weight' => $data['weight'] ?? null,
            ':microchip_number' => $data['microchip_number'] ?? null,
            ':known_allergies' => $data['known_allergies'] ?? null,
            ':photo_url' => $data['photo_url'] ?? null,
        ]);

        $id = (int)$pdo->lastInsertId();
        echo json_encode(['success' => true, 'pet_id' => $id]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        AuthGuard::checkRoles(['Admin', 'PetOwner']);
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (empty($data['pet_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing pet_id']);
            exit;
        }

        // Verify ownership for pet owners
        if ($auth['role'] === 'PetOwner') {
            $stmt = $pdo->prepare('SELECT p.pet_id FROM pets p JOIN pet_owners po ON p.owner_id = po.owner_id WHERE p.pet_id = :pet_id AND po.user_id = :user_id');
            $stmt->execute([':pet_id' => $data['pet_id'], ':user_id' => $auth['user_id']]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied']);
                exit;
            }
        }

        $updates = [];
        $params = [':pet_id' => (int)$data['pet_id']];

        $updatable = ['pet_name', 'species', 'breed', 'date_of_birth', 'sex', 'weight', 'microchip_number', 'known_allergies', 'photo_url'];
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

        $updates[] = 'updated_at = CURRENT_TIMESTAMP';
        $sql = 'UPDATE pets SET ' . implode(', ', $updates) . ' WHERE pet_id = :pet_id';

        $stmt = $pdo->prepare($sql);
        if ($stmt->execute($params)) {
            echo json_encode(['success' => true, 'message' => 'Pet updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update pet']);
        }
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        AuthGuard::checkRoles(['Admin', 'PetOwner']);
        parse_str(file_get_contents('php://input'), $data);

        if (empty($data['pet_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing pet_id']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM pets WHERE pet_id = :pet_id');
        if ($stmt->execute([':pet_id' => (int)$data['pet_id']])) {
            echo json_encode(['success' => true, 'message' => 'Pet deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete pet']);
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
