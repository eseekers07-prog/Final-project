<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';

use App\Config\AuthGuard;
use App\Config\Database;

$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);
$pdo = Database::getConnection();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $owners = [];
    if ($auth['role'] === 'Admin') {
        $owners = $pdo->query('SELECT owner_id, full_name, email, phone_number FROM pet_owners ORDER BY full_name ASC')->fetchAll();
    }

    if ($auth['role'] === 'PetOwner') {
        $petStmt = $pdo->prepare('
            SELECT p.pet_id, p.pet_name, p.species, p.breed, po.full_name AS owner_name
            FROM pets p
            INNER JOIN pet_owners po ON po.owner_id = p.owner_id
            WHERE po.user_id = :user_id
            ORDER BY p.pet_name ASC
        ');
        $petStmt->execute([':user_id' => $auth['user_id']]);
    } else {
        $petStmt = $pdo->query('
            SELECT p.pet_id, p.pet_name, p.species, p.breed, po.full_name AS owner_name
            FROM pets p
            INNER JOIN pet_owners po ON po.owner_id = p.owner_id
            ORDER BY p.pet_name ASC
        ');
    }

    $vetStmt = $pdo->query('
        SELECT v.vet_id, v.full_name, u.email, u.phone_number
        FROM veterinarians v
        INNER JOIN users u ON u.user_id = v.user_id
        WHERE u.account_status = "active"
        ORDER BY v.full_name ASC
    ');

    $productStmt = $pdo->query('
        SELECT product_id, product_name, manufacturer, batch_number
        FROM vaccination_products
        WHERE stock_quantity > 0 AND (expiry_date IS NULL OR expiry_date >= CURDATE())
        ORDER BY product_name ASC
    ');

    echo json_encode([
        'success' => true,
        'data' => [
            'owners' => $owners,
            'pets' => $petStmt->fetchAll(),
            'vets' => $vetStmt->fetchAll(),
            'products' => $productStmt->fetchAll(),
        ],
    ]);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to load lookup data']);
}
?>
