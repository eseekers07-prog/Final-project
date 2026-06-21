<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

use App\Config\Database;

$pdo = Database::getConnection();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $stmt = $pdo->query('
        SELECT p.product_id, p.product_name, p.manufacturer, p.batch_number, p.expiry_date,
               p.stock_quantity, p.description, p.price, p.delivery_available,
               p.requires_prescription, MAX(pp.photo_url) AS primary_photo
        FROM vaccination_products p
        LEFT JOIN product_photos pp ON p.product_id = pp.product_id AND pp.is_primary = 1
        WHERE p.is_customer_visible = 1
          AND p.stock_quantity > 0
          AND (p.expiry_date IS NULL OR p.expiry_date >= CURDATE())
        GROUP BY p.product_id
        ORDER BY p.product_name ASC
        LIMIT 40
    ');

    echo json_encode([
        'success' => true,
        'data' => [
            'clinic' => [
                'name' => 'Pet Care Management System',
                'phone' => '+94 77 123 4567',
                'email' => 'care@petclinic.local',
                'address' => 'No. 21, Main Street, Colombo',
                'hours' => 'Mon - Sat, 8:30 AM - 6:00 PM',
            ],
            'services' => [
                'Vaccinations and booster reminders',
                'General health checks and treatment plans',
                'Appointments with registered veterinarians',
                'Pet owner records, invoices, and product orders',
            ],
            'products' => $stmt->fetchAll(),
        ],
    ]);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to load public details']);
}
?>
