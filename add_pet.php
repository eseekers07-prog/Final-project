<?php
// 1. Set headers for CORS and JSON content type
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 2. Include database connection
require_once 'db.php';

// 3. Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Get raw posted data (JSON format)
    $data = json_decode(file_get_contents("php://input"));

    // Validate required fields
    if (
        !empty($data->name) &&
        !empty($data->species) &&
        !empty($data->owner_id)
    ) {
        try {
            // Prepare SQL query to prevent SQL Injection
            $query = "INSERT INTO pets (name, species, breed, age, weight, owner_id) 
                      VALUES (:name, :species, :breed, :age, :weight, :owner_id)";
            
            $stmt = $pdo->prepare($query);

            // Bind values and execute the query
            $stmt->execute([
                ':name'     => $data->name,
                ':species'  => $data->species,
                ':breed'    => $data->breed ?? null, // Default to null if not provided
                ':age'      => $data->age ?? null,
                ':weight'   => $data->weight ?? null,
                ':owner_id' => $data->owner_id
            ]);

            // Respond with success status code 201 (Created)
            http_response_code(201);
            echo json_encode(["message" => "Pet registered successfully."]);

        } catch (PDOException $e) {
            // Handle database errors
            http_response_code(500);
            echo json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        // Respond with bad request status code 400
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data. Name, species, and owner_id are required."]);
    }
} else {
    // Respond with method not allowed status code 405
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed. Use POST."]);
}
?>