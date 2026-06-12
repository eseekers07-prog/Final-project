<?php
// 1. Set headers for cross-origin access and JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 2. Include database connection file
require_once 'db.php';

// 3. Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Read the incoming raw JSON data from the frontend
    $data = json_decode(file_get_contents("php://input"));

    // Validate required fields
    if (
        !empty($data->name) &&
        !empty($data->email) &&
        !empty($data->password) &&
        !empty($data->phone)
    ) {
        try {
            // Check if email already exists in the database
            $checkEmailQuery = "SELECT id FROM users WHERE email = :email LIMIT 1";
            $checkStmt = $pdo->prepare($checkEmailQuery);
            $checkStmt->execute([':email' => $data->email]);

            if ($checkStmt->rowCount() > 0) {
                // Email already exists
                http_response_code(400);
                echo json_encode(["message" => "Email is already registered."]);
                exit();
            }

            // Secure the password using hashing (bcrypt)
            $hashed_password = password_hash($data->password, PASSWORD_BCRYPT);

            // Prepare SQL query to insert new user
            $query = "INSERT INTO users (name, email, password, role, phone) 
                      VALUES (:name, :email, :password, :role, :phone)";
            
            $stmt = $pdo->prepare($query);

            // Bind values and execute (default role is 'owner' if not specified)
            $stmt->execute([
                ':name'     => $data->name,
                ':email'    => $data->email,
                ':password' => $hashed_password,
                ':role'     => $data->role ?? 'owner', 
                ':phone'    => $data->phone
            ]);

            // Respond with 201 Created on success
            http_response_code(201);
            echo json_encode(["message" => "User registered successfully."]);

        } catch (PDOException $e) {
            // Handle database execution errors
            http_response_code(500);
            echo json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        // Respond with 400 Bad Request if mandatory data is missing
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data. Name, email, password, and phone are required."]);
    }
} else {
    // Respond with 405 Method Not Allowed if the request is not POST
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed. Use POST."]);
}
?>