<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';

use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

function savePrimaryProductPhoto(PDO $pdo, int $productId, ?string $photoUrl): void
{
    if (!$photoUrl) {
        return;
    }

    $clearStmt = $pdo->prepare('UPDATE product_photos SET is_primary = 0 WHERE product_id = :product_id');
    $clearStmt->execute([':product_id' => $productId]);

    $photoStmt = $pdo->prepare('INSERT INTO product_photos (product_id, photo_url, is_primary) VALUES (:product_id, :photo_url, 1)');
    $photoStmt->execute([
        ':product_id' => $productId,
        ':photo_url' => $photoUrl,
    ]);
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Check if requesting a specific product
        if (isset($_GET['product_id'])) {
            $product_id = (int)$_GET['product_id'];
            $stmt = $pdo->prepare('
                SELECT p.*, 
                       COUNT(pp.photo_id) as photo_count,
                       GROUP_CONCAT(pp.photo_url) as photos
                FROM vaccination_products p
                LEFT JOIN product_photos pp ON p.product_id = pp.product_id
                WHERE p.product_id = :product_id
                GROUP BY p.product_id
            ');
            $stmt->execute([':product_id' => $product_id]);
            $product = $stmt->fetch();
            
            if (!$product || ($auth['role'] === 'PetOwner' && (empty($product['is_customer_visible']) || (int)$product['stock_quantity'] <= 0 || (!empty($product['expiry_date']) && $product['expiry_date'] < date('Y-m-d'))))) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                exit;
            }

            $product['photos'] = $product['photos'] ? explode(',', $product['photos']) : [];
            echo json_encode(['success' => true, 'data' => $product]);
            exit;
        }

        // Get all products with filters
        $filters = [];
        $params = [];

        if ($auth['role'] === 'PetOwner') {
            $filters[] = 'p.is_customer_visible = 1';
            $filters[] = 'p.stock_quantity > 0';
            $filters[] = '(p.expiry_date IS NULL OR p.expiry_date >= CURDATE())';
        }
        
        if (!empty($_GET['search'])) {
            $filters[] = '(p.product_name LIKE :search OR p.manufacturer LIKE :search)';
            $params[':search'] = '%' . $_GET['search'] . '%';
        }

        if (isset($_GET['low_stock']) && $_GET['low_stock'] === 'true') {
            $filters[] = 'p.stock_quantity < 5';
        }

        if (isset($_GET['expired']) && $_GET['expired'] === 'true') {
            $filters[] = 'p.expiry_date < CURDATE()';
        }

        $where = !empty($filters) ? 'WHERE ' . implode(' AND ', $filters) : '';

        $stmt = $pdo->prepare("
            SELECT p.*, 
                   COUNT(pp.photo_id) as photo_count,
                   MAX(pp.photo_url) as primary_photo
            FROM vaccination_products p
            LEFT JOIN product_photos pp ON p.product_id = pp.product_id AND pp.is_primary = 1
            $where
            GROUP BY p.product_id
            ORDER BY p.product_name ASC
            LIMIT 1000
        ");
        $stmt->execute($params);
        $products = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $products]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        AuthGuard::checkRoles(['Admin']);
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['product_name', 'manufacturer'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
                exit;
            }
        }

        $stmt = $pdo->prepare('
            INSERT INTO vaccination_products 
            (product_name, manufacturer, batch_number, expiry_date, stock_quantity, description, price, is_customer_visible, requires_prescription, delivery_available)
            VALUES 
            (:product_name, :manufacturer, :batch_number, :expiry_date, :stock_quantity, :description, :price, :is_customer_visible, :requires_prescription, :delivery_available)
        ');

        $stmt->execute([
            ':product_name' => $data['product_name'],
            ':manufacturer' => $data['manufacturer'],
            ':batch_number' => $data['batch_number'] ?? null,
            ':expiry_date' => $data['expiry_date'] ?? null,
            ':stock_quantity' => (int)($data['stock_quantity'] ?? 0),
            ':description' => $data['description'] ?? null,
            ':price' => $data['price'] ?? null,
            ':is_customer_visible' => array_key_exists('is_customer_visible', $data) ? (!empty($data['is_customer_visible']) ? 1 : 0) : 1,
            ':requires_prescription' => array_key_exists('requires_prescription', $data) ? (!empty($data['requires_prescription']) ? 1 : 0) : 0,
            ':delivery_available' => array_key_exists('delivery_available', $data) ? (!empty($data['delivery_available']) ? 1 : 0) : 1
        ]);

        $product_id = $pdo->lastInsertId();
        savePrimaryProductPhoto($pdo, (int)$product_id, $data['photo_url'] ?? null);
        echo json_encode([
            'success' => true,
            'message' => 'Product created successfully',
            'product_id' => $product_id
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        AuthGuard::checkRoles(['Admin']);
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['product_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing product_id']);
            exit;
        }

        $updates = [];
        $params = [':product_id' => (int)$data['product_id']];

        $updatable = ['product_name', 'manufacturer', 'batch_number', 'expiry_date', 'stock_quantity', 'description', 'price', 'is_customer_visible', 'requires_prescription', 'delivery_available'];
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
        $sql = 'UPDATE vaccination_products SET ' . implode(', ', $updates) . ' WHERE product_id = :product_id';

        $stmt = $pdo->prepare($sql);
        if ($stmt->execute($params)) {
            savePrimaryProductPhoto($pdo, (int)$data['product_id'], $data['photo_url'] ?? null);
            echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update product']);
        }
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        AuthGuard::checkRoles(['Admin']);
        $rawBody = file_get_contents('php://input');
        $jsonBody = json_decode($rawBody, true);
        if (is_array($jsonBody)) {
            $data = $jsonBody;
        } else {
            parse_str($rawBody, $data);
        }

        if (empty($data['product_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing product_id']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM vaccination_products WHERE product_id = :product_id');
        if ($stmt->execute([':product_id' => (int)$data['product_id']])) {
            echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
