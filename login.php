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
    if (!empty($data->email) && !empty($data->password)) {
        try {
            // Fetch user details based on the provided email
            $query = "SELECT id, name, email, password, role FROM users WHERE email = :email LIMIT 1";
            $stmt = $pdo->prepare($query);
            $stmt->execute([':email' => $data->email]);

            // Check if user exists
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch();

                // Verify the password with the hashed password in the database
                if (password_verify($data->password, $user['password'])) {
                    
                    // Remove password from the response array for security
                    unset($user['password']);

                    // Login successful - Respond with 200 OK and user info
                    http_response_code(200);
                    echo json_encode([
                        "message" => "Login successful.",
                        "user" => $user
                    ]);
                } else {
                    // Invalid password
                    http_response_code(401);
                    echo json_encode(["message" => "Invalid email or password."]);
                }
            } else {
                // User not found
                http_response_code(401);
                echo json_encode(["message" => "Invalid email or password."]);
            }

        } catch (PDOException $e) {
            // Handle database errors
            http_response_code(500);
            echo json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        // Respond with 400 Bad Request if credentials are missing
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data. Email and password are required."]);
    }
} else {
    // Respond with 405 Method Not Allowed if the request is not POST
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed. Use POST."]);
}
?>