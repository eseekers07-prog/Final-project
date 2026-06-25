<?php
/**
 * backend/api/vets.php
 *
 * Drop this file into backend/api/ on the existing PHP project.
 * Returns the veterinarian list the mobile app's "Book Appointment"
 * step 1 (SelectVetScreen) needs — the web app never exposed this as
 * its own read endpoint (manage-vets.html only has an admin create flow).
 *
 * GET /backend/api/vets.php
 * Response: [{ "vetId":1, "fullName":"Dr. Michael Smith", "address":"..." }, ...]
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

use App\Config\Database;
use App\Config\AuthGuard;

header('Content-Type: application/json');

// Any authenticated user (Admin, Veterinarian, PetOwner) may read this list —
// pet owners need it to pick a vet when booking.
$user = AuthGuard::checkAuth();

$pdo = Database::getConnection();

$stmt = $pdo->query(
    'SELECT vet_id AS vetId, full_name AS fullName, address
     FROM veterinarians
     ORDER BY full_name ASC'
);

$vets = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($vets);
