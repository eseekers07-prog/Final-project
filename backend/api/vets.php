<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';

use App\Config\AuthGuard;
use App\Config\Database;

$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);
$pdo = Database::getConnection();

function vetsPayload(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function vetsText(array $data, string $field, int $max = 255): string
{
    $value = trim((string) ($data[$field] ?? ''));
    if ($value === '' || strlen($value) > $max) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => "Invalid {$field}"]);
        exit;
    }

    return $value;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query(
            'SELECT v.vet_id, v.user_id, v.full_name, u.username, u.email, u.phone_number, v.address, u.account_status, v.created_at
             FROM veterinarians v
             INNER JOIN users u ON u.user_id = v.user_id
             ORDER BY v.created_at DESC'
        );

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    AuthGuard::checkRole('Admin');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $data = vetsPayload();
    $fullName = vetsText($data, 'full_name', 150);
    $username = vetsText($data, 'username', 50);
    $email = vetsText($data, 'email', 150);
    $phone = vetsText($data, 'phone_number', 30);
    $password = (string) ($data['password'] ?? '');
    $address = vetsText($data, 'address', 1000);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit;
    }

    if (strlen($password) < 8) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
        exit;
    }

    $pdo->beginTransaction();

    $userStmt = $pdo->prepare(
        'INSERT INTO users (username, password, email, phone_number, role, account_status)
         VALUES (:username, :password, :email, :phone_number, :role, :account_status)'
    );
    $userStmt->execute([
        ':username' => $username,
        ':password' => password_hash($password, PASSWORD_DEFAULT),
        ':email' => $email,
        ':phone_number' => $phone,
        ':role' => 'Veterinarian',
        ':account_status' => 'active',
    ]);

    $userId = (int) $pdo->lastInsertId();

    $vetStmt = $pdo->prepare(
        'INSERT INTO veterinarians (user_id, full_name, address)
         VALUES (:user_id, :full_name, :address)'
    );
    $vetStmt->execute([
        ':user_id' => $userId,
        ':full_name' => $fullName,
        ':address' => $address,
    ]);

    $vetId = (int) $pdo->lastInsertId();
    $pdo->commit();

    echo json_encode(['success' => true, 'vet_id' => $vetId, 'message' => 'Veterinarian registered']);
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($exception->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
        exit;
    }

    error_log('Vets API error: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Vets API error: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
