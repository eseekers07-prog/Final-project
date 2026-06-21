<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';
use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

function invoiceJson(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function ensurePaymentTransactionsTable(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS payment_transactions (
          transaction_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
          invoice_id INT UNSIGNED NOT NULL,
          user_id INT UNSIGNED NOT NULL,
          reference VARCHAR(40) NOT NULL UNIQUE,
          amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          payment_method VARCHAR(50) NOT NULL,
          card_last4 VARCHAR(4) NULL,
          status ENUM('approved','failed','refunded') NOT NULL DEFAULT 'approved',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (transaction_id),
          INDEX idx_payment_invoice (invoice_id),
          INDEX idx_payment_user (user_id),
          CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
          CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

function luhnValid(string $number): bool
{
    $sum = 0;
    $alternate = false;
    for ($i = strlen($number) - 1; $i >= 0; $i--) {
        $digit = (int)$number[$i];
        if ($alternate) {
            $digit *= 2;
            if ($digit > 9) {
                $digit -= 9;
            }
        }
        $sum += $digit;
        $alternate = !$alternate;
    }

    return $sum % 10 === 0;
}

function validExpiry(string $expiry): bool
{
    if (!preg_match('/^(0[1-9]|1[0-2])\/(\d{2})$/', $expiry, $matches)) {
        return false;
    }

    $month = (int)$matches[1];
    $year = 2000 + (int)$matches[2];
    $expiresAt = DateTime::createFromFormat('Y-m-d H:i:s', sprintf('%04d-%02d-01 23:59:59', $year, $month));
    if (!$expiresAt) {
        return false;
    }
    $expiresAt->modify('last day of this month');

    return $expiresAt >= new DateTime('today');
}

try {
    ensurePaymentTransactionsTable($pdo);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $sql = 'SELECT i.*, a.scheduled_date, a.fee, p.pet_name, v.full_name AS vet_name,
                       pt.reference AS payment_reference, pt.created_at AS paid_at
                FROM invoices i
                LEFT JOIN appointments a ON i.appointment_id = a.appointment_id
                LEFT JOIN pets p ON a.pet_id = p.pet_id
                LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
                LEFT JOIN veterinarians v ON a.vet_id = v.vet_id
                LEFT JOIN (
                    SELECT invoice_id, MAX(transaction_id) AS latest_transaction_id
                    FROM payment_transactions
                    WHERE status = "approved"
                    GROUP BY invoice_id
                ) latest_pt ON latest_pt.invoice_id = i.invoice_id
                LEFT JOIN payment_transactions pt ON pt.transaction_id = latest_pt.latest_transaction_id';
        $params = [];

        if ($auth['role'] === 'PetOwner') {
            $sql .= ' WHERE po.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        } elseif ($auth['role'] === 'Veterinarian') {
            $sql .= ' WHERE v.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        }

        $stmt = $pdo->prepare($sql . ' ORDER BY i.issue_date DESC');
        $stmt->execute($params);
        $invoices = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $invoices]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = invoiceJson();

        if (($data['action'] ?? '') === 'pay_invoice') {
            AuthGuard::checkRole('PetOwner');
            $invoiceId = (int)($data['invoice_id'] ?? 0);
            $method = trim((string)($data['payment_method'] ?? 'Online Card'));
            $cardholderName = trim((string)($data['cardholder_name'] ?? ''));
            $cardNumber = preg_replace('/\D+/', '', (string)($data['card_number'] ?? ''));
            $expiry = trim((string)($data['expiry'] ?? ''));
            $cvv = preg_replace('/\D+/', '', (string)($data['cvv'] ?? ''));
            if ($invoiceId <= 0 || $method === '') {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Invalid payment request']);
                exit;
            }

            if ($cardholderName === '' || strlen($cardNumber) < 12 || strlen($cardNumber) > 19 || !luhnValid($cardNumber) || !validExpiry($expiry) || strlen($cvv) < 3 || strlen($cvv) > 4) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Please enter valid online payment details']);
                exit;
            }

            ensurePaymentTransactionsTable($pdo);
            $pdo->beginTransaction();

            $invoiceStmt = $pdo->prepare(
                "SELECT i.invoice_id, i.total_amount, i.payment_status
                 FROM invoices i
                 INNER JOIN appointments a ON i.appointment_id = a.appointment_id
                 INNER JOIN pets p ON a.pet_id = p.pet_id
                 INNER JOIN pet_owners po ON p.owner_id = po.owner_id
                 WHERE i.invoice_id = :invoice_id
                   AND po.user_id = :user_id
                 FOR UPDATE"
            );
            $invoiceStmt->execute([':invoice_id' => $invoiceId, ':user_id' => $auth['user_id']]);
            $invoice = $invoiceStmt->fetch();
            if (!$invoice || !in_array($invoice['payment_status'], ['pending', 'overdue'], true)) {
                $pdo->rollBack();
                echo json_encode(['success' => false, 'message' => 'Invoice is not payable']);
                exit;
            }

            $reference = 'PAY-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
            $pdo->prepare(
                'INSERT INTO payment_transactions (invoice_id, user_id, reference, amount, payment_method, card_last4, status)
                 VALUES (:invoice_id, :user_id, :reference, :amount, :payment_method, :card_last4, :status)'
            )->execute([
                ':invoice_id' => $invoiceId,
                ':user_id' => $auth['user_id'],
                ':reference' => $reference,
                ':amount' => $invoice['total_amount'],
                ':payment_method' => substr($method, 0, 50),
                ':card_last4' => substr($cardNumber, -4),
                ':status' => 'approved',
            ]);

            $pdo->prepare("UPDATE invoices SET payment_status = 'paid', payment_method = :method WHERE invoice_id = :invoice_id")
                ->execute([':method' => substr($method, 0, 50), ':invoice_id' => $invoiceId]);
            $pdo->commit();

            echo json_encode(['success' => true, 'message' => 'Online payment approved', 'reference' => $reference]);
            exit;
        }

        AuthGuard::checkRole('Admin');

        $required = ['appointment_id', 'total_amount'];
        foreach ($required as $r) {
            if (!isset($data[$r])) {
                echo json_encode(['success' => false, 'message' => "Missing field: $r"]);
                exit;
            }
        }

        $stmt = $pdo->prepare('INSERT INTO invoices (appointment_id, total_amount, payment_status, payment_method, issue_date) VALUES (:appointment_id, :total_amount, :payment_status, :payment_method, :issue_date)');
        $stmt->execute([
            ':appointment_id' => $data['appointment_id'],
            ':total_amount' => $data['total_amount'],
            ':payment_status' => $data['payment_status'] ?? 'pending',
            ':payment_method' => $data['payment_method'] ?? null,
            ':issue_date' => $data['issue_date'] ?? date('Y-m-d H:i:s'),
        ]);

        $id = (int)$pdo->lastInsertId();
        echo json_encode(['success' => true, 'invoice_id' => $id]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Invoices API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}
