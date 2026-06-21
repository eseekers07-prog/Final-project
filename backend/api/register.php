<?php
// ============================================================================
// CORS Configuration - Handle Cross-Origin Requests from Live Server
// ============================================================================
header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=UTF-8");

// ============================================================================
// Handle Preflight OPTIONS Request (Required for CORS)
// ============================================================================
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ============================================================================
// Error Handling & Configuration
// ============================================================================
error_reporting(E_ALL);
ini_set('log_errors', '1');
ini_set('display_errors', '0');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function jsonResponse(string $status, string $message, int $httpCode = 200): void
{
    http_response_code($httpCode);
    echo json_encode([
        'status' => $status,
        'success' => $status === 'success',
        'message' => $message,
    ]);
    exit;
}

function requestData(): array
{
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));

    if (strpos($contentType, 'application/json') !== false) {
        $rawInput = file_get_contents('php://input');
        $jsonData = json_decode($rawInput ?: '', true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($jsonData)) {
            jsonResponse('error', 'Invalid JSON payload.', 400);
        }

        return $jsonData;
    }

    return $_POST;
}

function requiredField(array $data, string $key): string
{
    $value = trim((string) ($data[$key] ?? ''));

    if ($value === '') {
        jsonResponse('error', "{$key} is required.", 422);
    }

    return $value;
}

// ============================================================================
// Validate Request Method
// ============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse('error', 'Only POST requests are allowed.', 405);
}

$conn = null;

try {
    // ========================================================================
    // Parse Request Data
    // ========================================================================
    $data = requestData();

    $fullName = requiredField($data, 'full_name');
    $username = requiredField($data, 'username');
    $email = requiredField($data, 'email');
    $phoneNumber = requiredField($data, 'phone_number');
    $password = requiredField($data, 'password');
    $address = requiredField($data, 'address');

    // ========================================================================
    // Validation
    // ========================================================================
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse('error', 'Invalid email address.', 422);
    }

    if (strlen($password) < 8) {
        jsonResponse('error', 'Password must be at least 8 characters.', 422);
    }

    // ========================================================================
    // Database Connection
    // ========================================================================
    $dbHost = getenv('DB_HOST') ?: '127.0.0.1';
    $dbPort = (int) (getenv('DB_PORT') ?: 3306);
    $dbName = getenv('DB_NAME') ?: 'veterinary_clinic';
    $dbUser = getenv('DB_USER') ?: 'root';
    $dbPass = getenv('DB_PASS') ?: '';

    $conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);
    $conn->set_charset('utf8mb4');
    $conn->begin_transaction();

    // ========================================================================
    // Create User Account
    // ========================================================================
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $role = 'PetOwner';

    $userStmt = $conn->prepare(
        'INSERT INTO users (username, password, email, phone_number, role)
         VALUES (?, ?, ?, ?, ?)'
    );
    $userStmt->bind_param('sssss', $username, $hashedPassword, $email, $phoneNumber, $role);
    $userStmt->execute();

    $userId = $conn->insert_id;

    $ownerStmt = $conn->prepare(
        'INSERT INTO pet_owners (user_id, full_name, address)
         VALUES (?, ?, ?)'
    );
    $ownerStmt->bind_param('iss', $userId, $fullName, $address);
    $ownerStmt->execute();

    $conn->commit();

    jsonResponse('success', 'Registration successful!');
} catch (Throwable $e) {
    if ($conn instanceof mysqli) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log('Registration rollback failed: ' . $rollbackError->getMessage());
        }
    }

    error_log('Registration failed: ' . $e->getMessage());

    if ($e instanceof mysqli_sql_exception && (int) $e->getCode() === 1062) {
        jsonResponse('error', 'Username or email already exists.', 409);
    }

    jsonResponse('error', $e->getMessage(), 500);
} finally {
    if ($conn instanceof mysqli) {
        $conn->close();
    }
}
