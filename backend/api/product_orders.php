<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';

use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

function orderJson(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function orderOwnerId(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare('SELECT owner_id FROM pet_owners WHERE user_id = :user_id LIMIT 1');
    $stmt->execute([':user_id' => $userId]);
    $ownerId = $stmt->fetchColumn();
    if (!$ownerId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Pet owner profile not found']);
        exit;
    }
    return (int)$ownerId;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!in_array($auth['role'], ['Admin', 'PetOwner'], true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            exit;
        }

        $params = [];
        $where = '';
        if ($auth['role'] === 'PetOwner') {
            $where = 'WHERE po.user_id = :user_id';
            $params[':user_id'] = $auth['user_id'];
        }

        $stmt = $pdo->prepare("
            SELECT o.*, po.full_name AS customer_name, u.email AS customer_email,
                   GROUP_CONCAT(CONCAT(oi.quantity, ' x ', oi.product_name_snapshot) SEPARATOR ', ') AS items_summary
            FROM product_orders o
            JOIN pet_owners po ON o.owner_id = po.owner_id
            JOIN users u ON po.user_id = u.user_id
            LEFT JOIN product_order_items oi ON o.order_id = oi.order_id
            $where
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
            LIMIT 200
        ");
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($auth['role'] === 'PetOwner') {
            $data = orderJson();
            $productId = (int)($data['product_id'] ?? 0);
            $quantity = max(1, min(99, (int)($data['quantity'] ?? 1)));
            $deliveryMethod = (string)($data['delivery_method'] ?? 'delivery');
            if (!in_array($deliveryMethod, ['delivery', 'pickup'], true)) {
                $deliveryMethod = 'delivery';
            }

            $address = trim((string)($data['delivery_address'] ?? ''));
            $phone = trim((string)($data['contact_phone'] ?? ''));
            if ($productId <= 0 || $phone === '' || ($deliveryMethod === 'delivery' && $address === '')) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Product, phone, and delivery address are required']);
                exit;
            }

            $pdo->beginTransaction();

            $productStmt = $pdo->prepare(
                "SELECT product_id, product_name, stock_quantity, price, delivery_available, requires_prescription
                 FROM vaccination_products
                 WHERE product_id = :product_id
                   AND is_customer_visible = 1
                   AND stock_quantity > 0
                   AND (expiry_date IS NULL OR expiry_date >= CURDATE())
                 FOR UPDATE
                 LIMIT 1"
            );
            $productStmt->execute([':product_id' => $productId]);
            $product = $productStmt->fetch();
            if (!$product) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product is not available for ordering']);
                exit;
            }

            if ($deliveryMethod === 'delivery' && empty($product['delivery_available'])) {
                $pdo->rollBack();
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Delivery is not available for this product']);
                exit;
            }

            if ((int)$product['stock_quantity'] < $quantity) {
                $pdo->rollBack();
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Requested quantity is not available']);
                exit;
            }

            $ownerId = orderOwnerId($pdo, $auth['user_id']);
            $unitPrice = (float)($product['price'] ?? 0);
            $subtotal = $unitPrice * $quantity;
            $deliveryFee = $deliveryMethod === 'delivery' ? 5.00 : 0.00;
            $total = $subtotal + $deliveryFee;

            $orderStmt = $pdo->prepare(
                'INSERT INTO product_orders
                 (owner_id, status, delivery_method, delivery_address, contact_phone, notes, subtotal, delivery_fee, total_amount, payment_status, requested_delivery_date)
                 VALUES
                 (:owner_id, :status, :delivery_method, :delivery_address, :contact_phone, :notes, :subtotal, :delivery_fee, :total_amount, :payment_status, :requested_delivery_date)'
            );
            $orderStmt->execute([
                ':owner_id' => $ownerId,
                ':status' => 'pending',
                ':delivery_method' => $deliveryMethod,
                ':delivery_address' => $deliveryMethod === 'delivery' ? $address : null,
                ':contact_phone' => $phone,
                ':notes' => trim((string)($data['notes'] ?? '')) ?: null,
                ':subtotal' => $subtotal,
                ':delivery_fee' => $deliveryFee,
                ':total_amount' => $total,
                ':payment_status' => 'pending',
                ':requested_delivery_date' => $data['requested_delivery_date'] ?? null,
            ]);
            $orderId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare(
                'INSERT INTO product_order_items
                 (order_id, product_id, product_name_snapshot, unit_price, quantity, total_price)
                 VALUES (:order_id, :product_id, :product_name_snapshot, :unit_price, :quantity, :total_price)'
            );
            $itemStmt->execute([
                ':order_id' => $orderId,
                ':product_id' => $productId,
                ':product_name_snapshot' => $product['product_name'],
                ':unit_price' => $unitPrice,
                ':quantity' => $quantity,
                ':total_price' => $subtotal,
            ]);

            $deductStmt = $pdo->prepare(
                'UPDATE vaccination_products
                 SET stock_quantity = stock_quantity - :quantity
                 WHERE product_id = :product_id AND stock_quantity >= :quantity'
            );
            $deductStmt->execute([':quantity' => $quantity, ':product_id' => $productId]);
            if ($deductStmt->rowCount() !== 1) {
                $pdo->rollBack();
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Requested quantity is not available']);
                exit;
            }
            $pdo->commit();

            echo json_encode(['success' => true, 'message' => 'Order placed for clinic confirmation', 'order_id' => $orderId]);
            exit;
        }

        AuthGuard::checkRole('Admin');
        $data = orderJson();
        $orderId = (int)($data['order_id'] ?? 0);
        $status = (string)($data['status'] ?? '');
        $allowed = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
        if ($orderId <= 0 || !in_array($status, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Valid order and status are required']);
            exit;
        }

        $pdo->beginTransaction();
        $orderStmt = $pdo->prepare('SELECT status FROM product_orders WHERE order_id = :order_id FOR UPDATE');
        $orderStmt->execute([':order_id' => $orderId]);
        $order = $orderStmt->fetch();
        if (!$order) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            exit;
        }

        $itemStmt = $pdo->prepare('SELECT product_id, quantity FROM product_order_items WHERE order_id = :order_id AND product_id IS NOT NULL');
        $itemStmt->execute([':order_id' => $orderId]);
        $items = $itemStmt->fetchAll();
        $previousStatus = (string)$order['status'];

        if ($previousStatus !== 'cancelled' && $status === 'cancelled') {
            $restoreStmt = $pdo->prepare('UPDATE vaccination_products SET stock_quantity = stock_quantity + :quantity WHERE product_id = :product_id');
            foreach ($items as $item) {
                $restoreStmt->execute([
                    ':quantity' => (int)$item['quantity'],
                    ':product_id' => (int)$item['product_id'],
                ]);
            }
        } elseif ($previousStatus === 'cancelled' && $status !== 'cancelled') {
            $stockStmt = $pdo->prepare('SELECT stock_quantity FROM vaccination_products WHERE product_id = :product_id FOR UPDATE');
            $deductStmt = $pdo->prepare('UPDATE vaccination_products SET stock_quantity = stock_quantity - :quantity WHERE product_id = :product_id');
            foreach ($items as $item) {
                $stockStmt->execute([':product_id' => (int)$item['product_id']]);
                $available = (int)$stockStmt->fetchColumn();
                if ($available < (int)$item['quantity']) {
                    $pdo->rollBack();
                    http_response_code(422);
                    echo json_encode(['success' => false, 'message' => 'Not enough stock to reactivate this order']);
                    exit;
                }
                $deductStmt->execute([
                    ':quantity' => (int)$item['quantity'],
                    ':product_id' => (int)$item['product_id'],
                ]);
            }
        }

        $paymentStatus = $status === 'cancelled' ? ', payment_status = "cancelled"' : '';
        $pdo->prepare("UPDATE product_orders SET status = :status $paymentStatus WHERE order_id = :order_id")
            ->execute([':status' => $status, ':order_id' => $orderId]);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Order status updated']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Product orders API error: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Product order operation failed']);
}
