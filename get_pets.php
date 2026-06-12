<?php
// 1. Set headers for cross-origin access and JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 2. Include database connection file
require_once 'db.php';

// 3. Check if the request method is GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    try {
        // Check if a specific owner_id is passed in the URL (Query Parameter)
        if (isset($_GET['owner_id']) && !empty($_GET['owner_id'])) {
            
            $owner_id = $_GET['owner_id'];
            
            // Prepare SQL to fetch pets belonging to a specific owner
            $query = "SELECT * FROM pets WHERE owner_id = :owner_id ORDER BY created_at DESC";
            $stmt = $pdo->prepare($query);
            $stmt->execute([':owner_id' => $owner_id]);
            
        } else {
            // If no owner_id is provided, fetch ALL pets from the database
            $query = "SELECT * FROM pets ORDER BY created_at DESC";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
        }

        // Fetch all matching records as an associative array
        $pets = $stmt->fetchAll();

        // Respond with 200 OK and the data
        http_response_code(200);
        echo json_encode($pets);

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
    
} else {
    // Respond with 405 Method Not Allowed if the request is not GET
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed. Use GET."]);
}
?>