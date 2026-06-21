#!/usr/bin/env php
<?php
/**
 * Database Seed Script
 * Run: php seed.php
 * Populates the database with test data
 */

require_once __DIR__ . '/backend/config/db.php';

use App\Config\Database;

$pdo = Database::getConnection();

$adminUsername = 'Admin';
$adminPassword = '1234567890';
$adminHashedPassword = password_hash($adminPassword, PASSWORD_BCRYPT);

// Hash for demo non-admin users: "password123"
$hashedPassword = password_hash('password123', PASSWORD_BCRYPT);

echo "🌱 Seeding database...\n";

try {
    // Clear existing data (optional - comment out to preserve data)
    // $pdo->exec('TRUNCATE TABLE users CASCADE;');

    // ===== INSERT USERS =====
    echo "📝 Creating users...\n";

    // Admin user
    $pdo->prepare('INSERT INTO users (username, password, email, phone_number, role, account_status) VALUES (:u, :p, :e, :ph, :r, :s)')
        ->execute([
            ':u' => $adminUsername,
            ':p' => $adminHashedPassword,
            ':e' => 'admin@vetclinic.com',
            ':ph' => '+1-800-VET-CLINIC',
            ':r' => 'Admin',
            ':s' => 'active'
        ]);
    $adminUserId = (int)$pdo->lastInsertId();
    echo "✓ Admin user created (ID: $adminUserId)\n";

    // Veterinarian user
    $pdo->prepare('INSERT INTO users (username, password, email, phone_number, role, account_status) VALUES (:u, :p, :e, :ph, :r, :s)')
        ->execute([
            ':u' => 'drsmith',
            ':p' => $hashedPassword,
            ':e' => 'dr.smith@vetclinic.com',
            ':ph' => '+1-555-0101',
            ':r' => 'Veterinarian',
            ':s' => 'active'
        ]);
    $vetUserId = (int)$pdo->lastInsertId();
    echo "✓ Veterinarian user created (ID: $vetUserId)\n";

    // Another Veterinarian
    $pdo->prepare('INSERT INTO users (username, password, email, phone_number, role, account_status) VALUES (:u, :p, :e, :ph, :r, :s)')
        ->execute([
            ':u' => 'drjones',
            ':p' => $hashedPassword,
            ':e' => 'dr.jones@vetclinic.com',
            ':ph' => '+1-555-0102',
            ':r' => 'Veterinarian',
            ':s' => 'active'
        ]);
    $vet2UserId = (int)$pdo->lastInsertId();

    // Pet Owner users
    $pdo->prepare('INSERT INTO users (username, password, email, phone_number, role, account_status) VALUES (:u, :p, :e, :ph, :r, :s)')
        ->execute([
            ':u' => 'johndoe',
            ':p' => $hashedPassword,
            ':e' => 'john@example.com',
            ':ph' => '+1-555-1001',
            ':r' => 'PetOwner',
            ':s' => 'active'
        ]);
    $owner1UserId = (int)$pdo->lastInsertId();
    echo "✓ Pet owner user created (ID: $owner1UserId)\n";

    $pdo->prepare('INSERT INTO users (username, password, email, phone_number, role, account_status) VALUES (:u, :p, :e, :ph, :r, :s)')
        ->execute([
            ':u' => 'sarahwilson',
            ':p' => $hashedPassword,
            ':e' => 'sarah@example.com',
            ':ph' => '+1-555-1002',
            ':r' => 'PetOwner',
            ':s' => 'active'
        ]);
    $owner2UserId = (int)$pdo->lastInsertId();

    // ===== INSERT VETERINARIANS =====
    echo "👨‍⚕️ Creating veterinarian profiles...\n";

    $pdo->prepare('INSERT INTO veterinarians (user_id, full_name, address) VALUES (:uid, :name, :addr)')
        ->execute([
            ':uid' => $vetUserId,
            ':name' => 'Dr. Michael Smith',
            ':addr' => '123 Medical Drive, Pet City, PC 12345'
        ]);
    $vet1Id = (int)$pdo->lastInsertId();
    echo "✓ Dr. Smith profile created (Vet ID: $vet1Id)\n";

    $pdo->prepare('INSERT INTO veterinarians (user_id, full_name, address) VALUES (:uid, :name, :addr)')
        ->execute([
            ':uid' => $vet2UserId,
            ':name' => 'Dr. Sarah Jones',
            ':addr' => '456 Care Avenue, Pet City, PC 12346'
        ]);
    $vet2Id = (int)$pdo->lastInsertId();

    // ===== INSERT PET OWNERS =====
    echo "👤 Creating pet owner profiles...\n";

    $pdo->prepare('INSERT INTO pet_owners (user_id, full_name, address) VALUES (:uid, :name, :addr)')
        ->execute([
            ':uid' => $owner1UserId,
            ':name' => 'John Doe',
            ':addr' => '789 Oak Street, Pet City, PC 12347'
        ]);
    $owner1Id = (int)$pdo->lastInsertId();
    echo "✓ John Doe profile created (Owner ID: $owner1Id)\n";

    $pdo->prepare('INSERT INTO pet_owners (user_id, full_name, address) VALUES (:uid, :name, :addr)')
        ->execute([
            ':uid' => $owner2UserId,
            ':name' => 'Sarah Wilson',
            ':addr' => '321 Maple Lane, Pet City, PC 12348'
        ]);
    $owner2Id = (int)$pdo->lastInsertId();

    // ===== INSERT PETS =====
    echo "🐾 Creating pets...\n";

    $pdo->prepare('INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, sex, weight, microchip_number, known_allergies) VALUES (:oid, :name, :species, :breed, :dob, :sex, :weight, :chip, :allergies)')
        ->execute([
            ':oid' => $owner1Id,
            ':name' => 'Buddy',
            ':species' => 'Dog',
            ':breed' => 'Golden Retriever',
            ':dob' => '2020-03-15',
            ':sex' => 'Male',
            ':weight' => 28.5,
            ':chip' => 'CHIP001234567890',
            ':allergies' => 'Chicken'
        ]);
    $pet1Id = (int)$pdo->lastInsertId();
    echo "✓ Buddy (Dog) created (Pet ID: $pet1Id)\n";

    $pdo->prepare('INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, sex, weight, microchip_number, known_allergies) VALUES (:oid, :name, :species, :breed, :dob, :sex, :weight, :chip, :allergies)')
        ->execute([
            ':oid' => $owner1Id,
            ':name' => 'Whiskers',
            ':species' => 'Cat',
            ':breed' => 'Persian',
            ':dob' => '2021-06-10',
            ':sex' => 'Female',
            ':weight' => 4.2,
            ':chip' => 'CHIP009876543210',
            ':allergies' => null
        ]);
    $pet2Id = (int)$pdo->lastInsertId();

    $pdo->prepare('INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, sex, weight, microchip_number, known_allergies) VALUES (:oid, :name, :species, :breed, :dob, :sex, :weight, :chip, :allergies)')
        ->execute([
            ':oid' => $owner2Id,
            ':name' => 'Max',
            ':species' => 'Dog',
            ':breed' => 'Labrador',
            ':dob' => '2019-11-20',
            ':sex' => 'Male',
            ':weight' => 32.0,
            ':chip' => 'CHIP005555555555',
            ':allergies' => 'Beef'
        ]);
    $pet3Id = (int)$pdo->lastInsertId();

    // ===== INSERT APPOINTMENTS =====
    echo "📅 Creating appointments...\n";

    $pdo->prepare('INSERT INTO appointments (vet_id, pet_id, scheduled_date, type, status, resone, fee) VALUES (:vid, :pid, :date, :type, :status, :reason, :fee)')
        ->execute([
            ':vid' => $vet1Id,
            ':pid' => $pet1Id,
            ':date' => date('Y-m-d H:i:s', strtotime('+2 days 10:00')),
            ':type' => 'Check-up',
            ':status' => 'scheduled',
            ':reason' => 'Regular health check',
            ':fee' => 75.00
        ]);
    $appt1Id = (int)$pdo->lastInsertId();
    echo "✓ Appointment created (Appt ID: $appt1Id)\n";

    $pdo->prepare('INSERT INTO appointments (vet_id, pet_id, scheduled_date, type, status, resone, fee) VALUES (:vid, :pid, :date, :type, :status, :reason, :fee)')
        ->execute([
            ':vid' => $vet2Id,
            ':pid' => $pet2Id,
            ':date' => date('Y-m-d H:i:s', strtotime('+5 days 14:00')),
            ':type' => 'Vaccination',
            ':status' => 'scheduled',
            ':reason' => 'Annual vaccination',
            ':fee' => 50.00
        ]);
    $appt2Id = (int)$pdo->lastInsertId();

    // ===== INSERT HEALTH RECORDS =====
    echo "🏥 Creating health records...\n";

    $pdo->prepare('INSERT INTO health_records (pet_id, vet_id, appointment_id, visit_date, clinical_finding, diagnosis_code, treatment_plan, lab_results) VALUES (:pid, :vid, :aid, :date, :finding, :code, :plan, :results)')
        ->execute([
            ':pid' => $pet1Id,
            ':vid' => $vet1Id,
            ':aid' => $appt1Id,
            ':date' => date('Y-m-d H:i:s'),
            ':finding' => 'Slight ear infection observed',
            ':code' => 'EAR_INF_001',
            ':plan' => 'Prescribed antibiotics for 10 days',
            ':results' => 'Sample culture sent'
        ]);
    $record1Id = (int)$pdo->lastInsertId();
    echo "✓ Health record created (Record ID: $record1Id)\n";

    // ===== INSERT INVOICES =====
    echo "💰 Creating invoices...\n";

    $pdo->prepare('INSERT INTO invoices (appointment_id, total_amount, payment_status, payment_method, issue_date) VALUES (:aid, :amount, :status, :method, :date)')
        ->execute([
            ':aid' => $appt1Id,
            ':amount' => 75.00,
            ':status' => 'pending',
            ':method' => null,
            ':date' => date('Y-m-d H:i:s')
        ]);
    echo "✓ Invoice created\n";

    $pdo->prepare('INSERT INTO invoices (appointment_id, total_amount, payment_status, payment_method, issue_date) VALUES (:aid, :amount, :status, :method, :date)')
        ->execute([
            ':aid' => $appt2Id,
            ':amount' => 50.00,
            ':status' => 'paid',
            ':method' => 'Credit Card',
            ':date' => date('Y-m-d H:i:s')
        ]);

    // ===== INSERT VACCINATIONS =====
    echo "💉 Creating vaccination records...\n";

    $pdo->prepare('INSERT INTO vaccinations (pet_id, adminstered_vet_id, vaccine_name, date, next_due_date, reaction_noted) VALUES (:pid, :vid, :name, :date, :next_date, :reaction)')
        ->execute([
            ':pid' => $pet1Id,
            ':vid' => $vet1Id,
            ':name' => 'DHPP',
            ':date' => '2024-01-15',
            ':next_date' => '2025-01-15',
            ':reaction' => null
        ]);
    echo "✓ Vaccination record created\n";

    echo "\n✅ Database seeding complete!\n";
    echo "\n🔑 TEST CREDENTIALS:\n";
    echo "├─ Admin: username='{$adminUsername}', password='{$adminPassword}'\n";
    echo "├─ Vet: username='drsmith', password='password123'\n";
    echo "└─ Owner: username='johndoe', password='password123'\n";

} catch (\Exception $e) {
    echo "\n❌ Seeding failed: " . $e->getMessage() . "\n";
    exit(1);
}
