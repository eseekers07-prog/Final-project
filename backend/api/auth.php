<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

use App\Config\Database;

$pdo = Database::getConnection();

function readJson(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function requireText(array $data, string $field, int $max = 255): string
{
    $value = trim((string) ($data[$field] ?? ''));
    if ($value === '' || strlen($value) > $max) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => "Invalid {$field}"]);
        exit;
    }

    return $value;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'success' => !empty($_SESSION['user_id']),
        'user' => !empty($_SESSION['user_id']) ? [
            'user_id' => (int) $_SESSION['user_id'],
            'role' => (string) $_SESSION['role'],
            'email' => (string) ($_SESSION['email'] ?? ''),
            'username' => (string) ($_SESSION['username'] ?? ''),
        ] : null,
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = readJson();
$action = (string) ($data['action'] ?? 'login');

try {
    if ($action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
        }
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'register') {
        $fullName = requireText($data, 'full_name', 150);
        $username = requireText($data, 'username', 50);
        $email = requireText($data, 'email', 150);
        $phone = requireText($data, 'phone_number', 30);
        $password = (string) ($data['password'] ?? '');
        $address = requireText($data, 'address', 1000);

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

        $role = 'PetOwner';

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
            ':role' => $role,
            ':account_status' => 'active',
        ]);

        $userId = (int) $pdo->lastInsertId();

        $ownerStmt = $pdo->prepare(
            'INSERT INTO pet_owners (user_id, full_name, address)
             VALUES (:user_id, :full_name, :address)'
        );
        $ownerStmt->execute([
            ':user_id' => $userId,
            ':full_name' => $fullName,
            ':address' => $address,
        ]);

        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'Pet owner account created']);
        exit;
    }

    if ($action !== 'login') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unsupported action']);
        exit;
    }

    $username = requireText($data, 'username', 50);
    $password = (string) ($data['password'] ?? '');

    $stmt = $pdo->prepare(
        'SELECT user_id, username, password, email, role, account_status
         FROM users
         WHERE username = :username
         LIMIT 1'
    );
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if (!$user || $user['account_status'] !== 'active' || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['user_id'];
    $_SESSION['username'] = (string) $user['username'];
    $_SESSION['email'] = (string) $user['email'];
    $_SESSION['role'] = (string) $user['role'];

    $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE user_id = :user_id')
        ->execute([':user_id' => $user['user_id']]);

    echo json_encode([
        'success' => true,
        'user_id' => (int) $user['user_id'],
        'username' => (string) $user['username'],
        'email' => (string) $user['email'],
        'role' => (string) $user['role'],
    ]);
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($exception->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
        exit;
    }

    error_log('Auth API error: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Auth API error: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
