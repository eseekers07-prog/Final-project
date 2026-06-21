<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';

http_response_code(403);
echo json_encode([
    'success' => false,
    'message' => 'Public admin registration is disabled. Use the default Admin account created by schema.sql or seed.php.',
]);
