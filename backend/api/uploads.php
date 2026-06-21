<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/AuthGuard.php';

use App\Config\Database;
use App\Config\AuthGuard;

$pdo = Database::getConnection();
$auth = AuthGuard::checkRoles(['Admin', 'Veterinarian', 'PetOwner']);

// Create uploads directory if it doesn't exist
$baseUploadDir = __DIR__ . '/../../uploads';
$categoryDirs = ['pets', 'vets', 'owners', 'products'];

foreach ($categoryDirs as $cat) {
    $dir = $baseUploadDir . '/' . $cat;
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No file uploaded']);
            exit;
        }

        $file = $_FILES['file'];
        $category = isset($_POST['category']) ? sanitizeInput($_POST['category']) : 'general';
        $entity_id = isset($_POST['entity_id']) ? (int)$_POST['entity_id'] : 0;

        // Validate category
        if (!in_array($category, $categoryDirs)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid category']);
            exit;
        }

        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'File upload error: ' . $file['error']]);
            exit;
        }

        // Check file size (max 5MB)
        $maxSize = 5 * 1024 * 1024;
        if ($file['size'] > $maxSize) {
            http_response_code(413);
            echo json_encode(['success' => false, 'message' => 'File too large. Max 5MB allowed.']);
            exit;
        }

        // Check file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPEG, PNG, WebP, GIF allowed.']);
            exit;
        }

        // Verify it's actually an image
        if (!getimagesize($file['tmp_name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'File is not a valid image']);
            exit;
        }

        // Generate unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid($category . '_' . $entity_id . '_', true) . '.' . strtolower($ext);
        $uploadPath = $baseUploadDir . '/' . $category . '/' . $filename;
        $relativeUrl = '/uploads/' . $category . '/' . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save file']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => 'File uploaded successfully',
            'filename' => $filename,
            'url' => $relativeUrl,
            'full_path' => $uploadPath
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        parse_str(file_get_contents('php://input'), $deleteData);
        $filename = isset($deleteData['filename']) ? sanitizeInput($deleteData['filename']) : '';
        $category = isset($deleteData['category']) ? sanitizeInput($deleteData['category']) : '';

        if (empty($filename) || empty($category)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing filename or category']);
            exit;
        }

        // Security: prevent directory traversal
        if (strpos($filename, '..') !== false || strpos($filename, '/') !== false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid filename']);
            exit;
        }

        $filePath = $baseUploadDir . '/' . $category . '/' . $filename;

        if (!file_exists($filePath)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'File not found']);
            exit;
        }

        if (!unlink($filePath)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete file']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function sanitizeInput(string $input): string
{
    return preg_replace('/[^a-zA-Z0-9_-]/', '', $input);
}
?>
