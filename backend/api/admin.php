<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';

use App\Config\AuthGuard;
use App\Config\Database;

AuthGuard::checkRole('Admin');
$pdo = Database::getConnection();

function adminJson(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function adminRequireInt(array $data, string $field): int
{
    $value = (int)($data[$field] ?? 0);
    if ($value <= 0) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => "Invalid {$field}"]);
        exit;
    }

    return $value;
}

function adminText(array $data, string $field, int $max = 255, bool $required = true): ?string
{
    $value = trim((string)($data[$field] ?? ''));
    if ($value === '') {
        if ($required) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => "{$field} is required"]);
            exit;
        }

        return null;
    }

    return substr($value, 0, $max);
}

function adminEnum(array $data, string $field, array $allowed): string
{
    $value = (string)($data[$field] ?? '');
    if (!in_array($value, $allowed, true)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => "Invalid {$field}"]);
        exit;
    }

    return $value;
}

function adminDateTime(array $data, string $field, bool $required = true): ?string
{
    $value = adminText($data, $field, 30, $required);
    if ($value === null) {
        return null;
    }

    $value = str_replace('T', ' ', $value);
    return strlen($value) === 16 ? "{$value}:00" : $value;
}

function adminOwnerPayload(array $data): array
{
    $email = adminText($data, 'email', 150);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Invalid email']);
        exit;
    }

    return [
        'full_name' => adminText($data, 'full_name', 150),
        'username' => adminText($data, 'username', 50),
        'email' => $email,
        'phone_number' => adminText($data, 'phone_number', 30),
        'address' => adminText($data, 'address', 1000),
        'password' => adminText($data, 'password', 255, false),
        'account_status' => adminEnum($data, 'account_status', ['active', 'suspended', 'disabled']),
    ];
}

function adminCreateProfile(PDO $pdo, array $data, string $role, string $table, string $message): void
{
    $payload = adminOwnerPayload($data);
    if ($payload['password'] === null || strlen($payload['password']) < 8) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
        exit;
    }

    $pdo->beginTransaction();
    $pdo->prepare(
        'INSERT INTO users (username, password, email, phone_number, role, account_status)
         VALUES (:username, :password, :email, :phone_number, :role, :account_status)'
    )->execute([
        ':username' => $payload['username'],
        ':password' => password_hash($payload['password'], PASSWORD_DEFAULT),
        ':email' => $payload['email'],
        ':phone_number' => $payload['phone_number'],
        ':role' => $role,
        ':account_status' => $payload['account_status'],
    ]);

    $userId = (int)$pdo->lastInsertId();
    $pdo->prepare("INSERT INTO {$table} (user_id, full_name, address) VALUES (:user_id, :full_name, :address)")
        ->execute([
            ':user_id' => $userId,
            ':full_name' => $payload['full_name'],
            ':address' => $payload['address'],
        ]);
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => $message]);
    exit;
}

function adminUpdateProfile(PDO $pdo, array $data, string $idField, string $table, string $key, string $message): void
{
    $id = adminRequireInt($data, $idField);
    $payload = adminOwnerPayload($data);
    if ($payload['password'] !== null && strlen($payload['password']) < 8) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT user_id FROM {$table} WHERE {$key} = :id");
    $stmt->execute([':id' => $id]);
    $userId = (int)$stmt->fetchColumn();
    if ($userId <= 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Record not found']);
        exit;
    }

    $pdo->beginTransaction();
    $params = [
        ':username' => $payload['username'],
        ':email' => $payload['email'],
        ':phone_number' => $payload['phone_number'],
        ':account_status' => $payload['account_status'],
        ':user_id' => $userId,
    ];
    $passwordSql = '';
    if ($payload['password'] !== null) {
        $passwordSql = ', password = :password';
        $params[':password'] = password_hash($payload['password'], PASSWORD_DEFAULT);
    }

    $pdo->prepare(
        "UPDATE users
         SET username = :username, email = :email, phone_number = :phone_number, account_status = :account_status{$passwordSql}
         WHERE user_id = :user_id"
    )->execute($params);

    $pdo->prepare("UPDATE {$table} SET full_name = :full_name, address = :address WHERE {$key} = :id")
        ->execute([
            ':full_name' => $payload['full_name'],
            ':address' => $payload['address'],
            ':id' => $id,
        ]);
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => $message]);
    exit;
}

function adminOverview(PDO $pdo): void
{
    $users = $pdo->query(
        "SELECT u.user_id, u.username, u.email, u.phone_number, u.role, u.account_status, u.created_at,
                COALESCE(po.full_name, v.full_name, 'System Administrator') AS full_name
         FROM users u
         LEFT JOIN pet_owners po ON po.user_id = u.user_id
         LEFT JOIN veterinarians v ON v.user_id = u.user_id
         ORDER BY u.created_at DESC"
    )->fetchAll();

    $owners = $pdo->query(
        "SELECT po.owner_id, po.user_id, po.full_name, u.username, u.email, u.phone_number, po.address, po.created_at
         FROM pet_owners po
         INNER JOIN users u ON u.user_id = po.user_id
         ORDER BY po.created_at DESC"
    )->fetchAll();

    $vets = $pdo->query(
        "SELECT v.vet_id, v.user_id, v.full_name, u.username, u.email, u.phone_number, v.address, u.account_status, v.created_at
         FROM veterinarians v
         INNER JOIN users u ON u.user_id = v.user_id
         ORDER BY v.created_at DESC"
    )->fetchAll();

    $pets = $pdo->query(
        "SELECT p.*, po.full_name AS owner_name
         FROM pets p
         INNER JOIN pet_owners po ON po.owner_id = p.owner_id
         ORDER BY p.created_at DESC"
    )->fetchAll();

    $appointments = $pdo->query(
        "SELECT a.*, p.pet_name, v.full_name AS vet_name
         FROM appointments a
         LEFT JOIN pets p ON p.pet_id = a.pet_id
         LEFT JOIN veterinarians v ON v.vet_id = a.vet_id
         ORDER BY a.scheduled_date DESC"
    )->fetchAll();

    $records = $pdo->query(
        "SELECT hr.*, p.pet_name, v.full_name AS vet_name
         FROM health_records hr
         LEFT JOIN pets p ON p.pet_id = hr.pet_id
         LEFT JOIN veterinarians v ON v.vet_id = hr.vet_id
         ORDER BY hr.visit_date DESC"
    )->fetchAll();

    $invoices = $pdo->query(
        "SELECT i.*, p.pet_name, a.scheduled_date
         FROM invoices i
         LEFT JOIN appointments a ON a.appointment_id = i.appointment_id
         LEFT JOIN pets p ON p.pet_id = a.pet_id
         ORDER BY i.issue_date DESC"
    )->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => [
            'users' => $users,
            'owners' => $owners,
            'vets' => $vets,
            'pets' => $pets,
            'appointments' => $appointments,
            'records' => $records,
            'invoices' => $invoices,
            'stats' => [
                'users' => count($users),
                'owners' => count($owners),
                'vets' => count($vets),
                'pets' => count($pets),
                'appointments' => count($appointments),
                'records' => count($records),
                'revenue' => array_reduce($invoices, static fn(float $sum, array $invoice): float => $sum + (float)$invoice['total_amount'], 0.0),
            ],
        ],
    ]);
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        adminOverview($pdo);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $data = adminJson();
    $action = (string)($data['action'] ?? '');

    if ($action === 'create_owner') {
        adminCreateProfile($pdo, $data, 'PetOwner', 'pet_owners', 'Pet owner added');
    }

    if ($action === 'update_owner') {
        adminUpdateProfile($pdo, $data, 'owner_id', 'pet_owners', 'owner_id', 'Pet owner updated');
    }

    if ($action === 'create_vet') {
        adminCreateProfile($pdo, $data, 'Veterinarian', 'veterinarians', 'Veterinarian added');
    }

    if ($action === 'update_vet') {
        adminUpdateProfile($pdo, $data, 'vet_id', 'veterinarians', 'vet_id', 'Veterinarian updated');
    }

    if ($action === 'create_pet' || $action === 'update_pet') {
        $payload = [
            'owner_id' => adminRequireInt($data, 'owner_id'),
            'pet_name' => adminText($data, 'pet_name', 120),
            'species' => adminText($data, 'species', 80),
            'breed' => adminText($data, 'breed', 120, false),
            'date_of_birth' => adminText($data, 'date_of_birth', 10, false),
            'sex' => adminEnum($data, 'sex', ['Male', 'Female', 'Unknown']),
            'weight' => !isset($data['weight']) || $data['weight'] === '' ? null : (float)$data['weight'],
            'microchip_number' => adminText($data, 'microchip_number', 100, false),
            'known_allergies' => adminText($data, 'known_allergies', 1000, false),
        ];

        if ($action === 'create_pet') {
            $pdo->prepare(
                'INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, sex, weight, microchip_number, known_allergies)
                 VALUES (:owner_id, :pet_name, :species, :breed, :date_of_birth, :sex, :weight, :microchip_number, :known_allergies)'
            )->execute($payload);
            echo json_encode(['success' => true, 'message' => 'Pet added']);
            exit;
        }

        $payload['pet_id'] = adminRequireInt($data, 'pet_id');
        $pdo->prepare(
            'UPDATE pets
             SET owner_id = :owner_id, pet_name = :pet_name, species = :species, breed = :breed,
                 date_of_birth = :date_of_birth, sex = :sex, weight = :weight,
                 microchip_number = :microchip_number, known_allergies = :known_allergies
             WHERE pet_id = :pet_id'
        )->execute($payload);
        echo json_encode(['success' => true, 'message' => 'Pet updated']);
        exit;
    }

    if ($action === 'create_appointment' || $action === 'update_appointment') {
        $payload = [
            'vet_id' => adminRequireInt($data, 'vet_id'),
            'pet_id' => adminRequireInt($data, 'pet_id'),
            'scheduled_date' => adminDateTime($data, 'scheduled_date'),
            'type' => adminText($data, 'type', 100),
            'status' => adminEnum($data, 'status', ['scheduled', 'completed', 'cancelled']),
            'resone' => adminText($data, 'resone', 1000, false),
            'fee' => !isset($data['fee']) || $data['fee'] === '' ? 0 : (float)$data['fee'],
        ];

        if ($action === 'create_appointment') {
            $pdo->prepare(
                'INSERT INTO appointments (vet_id, pet_id, scheduled_date, type, status, resone, fee)
                 VALUES (:vet_id, :pet_id, :scheduled_date, :type, :status, :resone, :fee)'
            )->execute($payload);
            echo json_encode(['success' => true, 'message' => 'Appointment added']);
            exit;
        }

        $payload['appointment_id'] = adminRequireInt($data, 'appointment_id');
        $pdo->prepare(
            'UPDATE appointments
             SET vet_id = :vet_id, pet_id = :pet_id, scheduled_date = :scheduled_date, type = :type,
                 status = :status, resone = :resone, fee = :fee
             WHERE appointment_id = :appointment_id'
        )->execute($payload);
        echo json_encode(['success' => true, 'message' => 'Appointment updated']);
        exit;
    }

    if ($action === 'create_health_record' || $action === 'update_health_record') {
        $payload = [
            'pet_id' => adminRequireInt($data, 'pet_id'),
            'vet_id' => adminRequireInt($data, 'vet_id'),
            'appointment_id' => empty($data['appointment_id']) ? null : (int)$data['appointment_id'],
            'visit_date' => adminDateTime($data, 'visit_date', false),
            'clinical_finding' => adminText($data, 'clinical_finding', 2000),
            'diagnosis_code' => adminText($data, 'diagnosis_code', 100, false),
            'treatment_plan' => adminText($data, 'treatment_plan', 2000, false),
            'lab_results' => adminText($data, 'lab_results', 2000, false),
        ];
        $payload['visit_date'] ??= date('Y-m-d H:i:s');

        if ($action === 'create_health_record') {
            $pdo->prepare(
                'INSERT INTO health_records (pet_id, vet_id, appointment_id, visit_date, clinical_finding, diagnosis_code, treatment_plan, lab_results)
                 VALUES (:pet_id, :vet_id, :appointment_id, :visit_date, :clinical_finding, :diagnosis_code, :treatment_plan, :lab_results)'
            )->execute($payload);
            echo json_encode(['success' => true, 'message' => 'Health record added']);
            exit;
        }

        $payload['record_id'] = adminRequireInt($data, 'record_id');
        $pdo->prepare(
            'UPDATE health_records
             SET pet_id = :pet_id, vet_id = :vet_id, appointment_id = :appointment_id, visit_date = :visit_date,
                 clinical_finding = :clinical_finding, diagnosis_code = :diagnosis_code,
                 treatment_plan = :treatment_plan, lab_results = :lab_results
             WHERE record_id = :record_id'
        )->execute($payload);
        echo json_encode(['success' => true, 'message' => 'Health record updated']);
        exit;
    }

    if ($action === 'create_invoice' || $action === 'update_invoice') {
        $payload = [
            'appointment_id' => adminRequireInt($data, 'appointment_id'),
            'total_amount' => isset($data['total_amount']) ? (float)$data['total_amount'] : 0,
            'payment_status' => adminEnum($data, 'payment_status', ['pending', 'paid', 'overdue', 'refunded']),
            'payment_method' => adminText($data, 'payment_method', 50, false),
        ];

        if ($action === 'create_invoice') {
            $pdo->prepare(
                'INSERT INTO invoices (appointment_id, total_amount, payment_status, payment_method)
                 VALUES (:appointment_id, :total_amount, :payment_status, :payment_method)'
            )->execute($payload);
            echo json_encode(['success' => true, 'message' => 'Invoice added']);
            exit;
        }

        $payload['invoice_id'] = adminRequireInt($data, 'invoice_id');
        $pdo->prepare(
            'UPDATE invoices
             SET appointment_id = :appointment_id, total_amount = :total_amount,
                 payment_status = :payment_status, payment_method = :payment_method
             WHERE invoice_id = :invoice_id'
        )->execute($payload);
        echo json_encode(['success' => true, 'message' => 'Invoice updated']);
        exit;
    }

    if ($action === 'update_user_status') {
        $userId = adminRequireInt($data, 'user_id');
        $status = (string)($data['account_status'] ?? '');
        if (!in_array($status, ['active', 'suspended', 'disabled'], true)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid account status']);
            exit;
        }

        $pdo->prepare('UPDATE users SET account_status = :status WHERE user_id = :user_id')
            ->execute([':status' => $status, ':user_id' => $userId]);
        echo json_encode(['success' => true, 'message' => 'User status updated']);
        exit;
    }

    if ($action === 'update_appointment_status') {
        $appointmentId = adminRequireInt($data, 'appointment_id');
        $status = (string)($data['status'] ?? '');
        if (!in_array($status, ['scheduled', 'completed', 'cancelled'], true)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid appointment status']);
            exit;
        }

        $pdo->prepare('UPDATE appointments SET status = :status WHERE appointment_id = :appointment_id')
            ->execute([':status' => $status, ':appointment_id' => $appointmentId]);
        echo json_encode(['success' => true, 'message' => 'Appointment status updated']);
        exit;
    }

    if ($action === 'update_invoice_status') {
        $invoiceId = adminRequireInt($data, 'invoice_id');
        $status = (string)($data['payment_status'] ?? '');
        if (!in_array($status, ['pending', 'paid', 'overdue', 'refunded'], true)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid payment status']);
            exit;
        }

        $pdo->prepare('UPDATE invoices SET payment_status = :status WHERE invoice_id = :invoice_id')
            ->execute([':status' => $status, ':invoice_id' => $invoiceId]);
        echo json_encode(['success' => true, 'message' => 'Invoice status updated']);
        exit;
    }

    if ($action === 'delete') {
        $entity = (string)($data['entity'] ?? '');
        $id = adminRequireInt($data, 'id');

        if ($entity === 'owner' || $entity === 'vet') {
            $profileTable = $entity === 'owner' ? 'pet_owners' : 'veterinarians';
            $profileKey = $entity === 'owner' ? 'owner_id' : 'vet_id';
            $stmt = $pdo->prepare("SELECT user_id FROM {$profileTable} WHERE {$profileKey} = :id");
            $stmt->execute([':id' => $id]);
            $userId = (int)$stmt->fetchColumn();

            if ($userId <= 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Record not found']);
                exit;
            }

            if ($userId === (int)($_SESSION['user_id'] ?? 0)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'You cannot delete your own admin account']);
                exit;
            }

            $pdo->prepare('DELETE FROM users WHERE user_id = :user_id')->execute([':user_id' => $userId]);
            echo json_encode(['success' => true, 'message' => 'Record deleted']);
            exit;
        }

        $map = [
            'user' => ['table' => 'users', 'key' => 'user_id'],
            'pet' => ['table' => 'pets', 'key' => 'pet_id'],
            'appointment' => ['table' => 'appointments', 'key' => 'appointment_id'],
            'health_record' => ['table' => 'health_records', 'key' => 'record_id'],
            'invoice' => ['table' => 'invoices', 'key' => 'invoice_id'],
        ];

        if (!isset($map[$entity])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid delete target']);
            exit;
        }

        if ($entity === 'user' && $id === (int)($_SESSION['user_id'] ?? 0)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'You cannot delete your own admin account']);
            exit;
        }

        $target = $map[$entity];
        $stmt = $pdo->prepare("DELETE FROM {$target['table']} WHERE {$target['key']} = :id");
        $stmt->execute([':id' => $id]);

        echo json_encode(['success' => true, 'message' => 'Record deleted']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Unsupported admin action']);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Admin API error: ' . $exception->getMessage());
    if ($exception instanceof PDOException && (int)$exception->getCode() === 23000) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Duplicate value or linked record constraint failed']);
        exit;
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Admin operation failed']);
}
