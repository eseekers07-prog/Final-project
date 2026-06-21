-- Veterinary Clinic Management System Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS veterinary_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE veterinary_clinic;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS product_order_items;
DROP TABLE IF EXISTS product_orders;
DROP TABLE IF EXISTS product_photos;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS health_records;
DROP TABLE IF EXISTS vaccinations;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS vaccination_products;
DROP TABLE IF EXISTS pet_owners;
DROP TABLE IF EXISTS veterinarians;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone_number VARCHAR(30),
  role ENUM('Admin','Veterinarian','PetOwner') NOT NULL DEFAULT 'PetOwner',
  account_status ENUM('active','suspended','disabled') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Veterinarians (extends user)
DROP TABLE IF EXISTS veterinarians;
CREATE TABLE veterinarians (
  vet_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  address TEXT,
  photo_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vet_id),
  UNIQUE KEY ux_vet_user (user_id),
  CONSTRAINT fk_vet_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pet owners (extends user)
DROP TABLE IF EXISTS pet_owners;
CREATE TABLE pet_owners (
  owner_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  address TEXT,
  photo_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (owner_id),
  UNIQUE KEY ux_owner_user (user_id),
  CONSTRAINT fk_owner_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pets
DROP TABLE IF EXISTS pets;
CREATE TABLE pets (
  pet_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id INT UNSIGNED NOT NULL,
  pet_name VARCHAR(120) NOT NULL,
  species VARCHAR(80) NOT NULL,
  breed VARCHAR(120),
  date_of_birth DATE,
  sex ENUM('Male','Female','Unknown') DEFAULT 'Unknown',
  weight DECIMAL(6,2),
  microchip_number VARCHAR(100) UNIQUE,
  known_allergies TEXT,
  photo_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (pet_id),
  CONSTRAINT fk_pet_owner FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vaccination products and shop catalog
CREATE TABLE vaccination_products (
  product_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(200) NOT NULL UNIQUE,
  manufacturer VARCHAR(150),
  batch_number VARCHAR(100),
  expiry_date DATE,
  stock_quantity INT NOT NULL DEFAULT 0,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_customer_visible TINYINT(1) NOT NULL DEFAULT 1,
  requires_prescription TINYINT(1) NOT NULL DEFAULT 0,
  delivery_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product_photos (
  photo_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (photo_id),
  CONSTRAINT fk_photo_product FOREIGN KEY (product_id) REFERENCES vaccination_products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointments
CREATE TABLE appointments (
  appointment_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vet_id INT UNSIGNED NULL,
  pet_id INT UNSIGNED NOT NULL,
  scheduled_date DATETIME NOT NULL,
  type VARCHAR(100) NOT NULL,
  status ENUM('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  resone TEXT,
  fee DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (appointment_id),
  CONSTRAINT fk_appointment_vet FOREIGN KEY (vet_id) REFERENCES veterinarians(vet_id) ON DELETE SET NULL,
  CONSTRAINT fk_appointment_pet FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invoices
CREATE TABLE invoices (
  invoice_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  appointment_id INT UNSIGNED NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('pending','paid','overdue','refunded') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (invoice_id),
  CONSTRAINT fk_invoice_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment_transactions (
  transaction_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  reference VARCHAR(40) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL,
  card_last4 VARCHAR(4) NULL,
  status ENUM('approved','failed','refunded') NOT NULL DEFAULT 'approved',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (transaction_id),
  CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vaccinations
CREATE TABLE vaccinations (
  vaccine_record_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pet_id INT UNSIGNED NOT NULL,
  adminstered_vet_id INT UNSIGNED NULL,
  vaccine_name VARCHAR(150) NOT NULL,
  date DATE NOT NULL,
  next_due_date DATE,
  reaction_noted TEXT,
  product_id INT UNSIGNED NULL,
  batch_number VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vaccine_record_id),
  CONSTRAINT fk_vacc_pet FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
  CONSTRAINT fk_vacc_vet FOREIGN KEY (adminstered_vet_id) REFERENCES veterinarians(vet_id) ON DELETE SET NULL,
  CONSTRAINT fk_vacc_product FOREIGN KEY (product_id) REFERENCES vaccination_products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Health records
CREATE TABLE health_records (
  record_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pet_id INT UNSIGNED NOT NULL,
  vet_id INT UNSIGNED NULL,
  appointment_id INT UNSIGNED NULL,
  visit_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clinical_finding TEXT,
  diagnosis_code VARCHAR(100),
  treatment_plan TEXT,
  lab_results TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  CONSTRAINT fk_hr_pet FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
  CONSTRAINT fk_hr_vet FOREIGN KEY (vet_id) REFERENCES veterinarians(vet_id) ON DELETE SET NULL,
  CONSTRAINT fk_hr_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Prescriptions
CREATE TABLE prescriptions (
  prescription_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  record_id INT UNSIGNED NOT NULL,
  issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (prescription_id),
  CONSTRAINT fk_prescription_record FOREIGN KEY (record_id) REFERENCES health_records(record_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Prescription items
CREATE TABLE prescription_items (
  item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  prescription_id INT UNSIGNED NOT NULL,
  drug_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  CONSTRAINT fk_item_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product delivery orders
CREATE TABLE product_orders (
  order_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id INT UNSIGNED NOT NULL,
  status ENUM('pending','confirmed','packed','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'pending',
  delivery_method ENUM('delivery','pickup') NOT NULL DEFAULT 'delivery',
  delivery_address TEXT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  notes TEXT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NULL,
  requested_delivery_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_product_order_owner FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product_order_items (
  item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NULL,
  product_name_snapshot VARCHAR(200) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  CONSTRAINT fk_product_order_item_order FOREIGN KEY (order_id) REFERENCES product_orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_product_order_item_product FOREIGN KEY (product_id) REFERENCES vaccination_products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Helpful indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_photo ON pets(photo_url);
CREATE INDEX idx_vets_photo ON veterinarians(photo_url);
CREATE INDEX idx_owners_photo ON pet_owners(photo_url);
CREATE INDEX idx_appointments_vet ON appointments(vet_id);
CREATE INDEX idx_payment_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_user ON payment_transactions(user_id);
CREATE INDEX idx_vacc_product ON vaccinations(product_id);
CREATE INDEX idx_vacc_due_date ON vaccinations(next_due_date);
CREATE INDEX idx_product_expiry ON vaccination_products(expiry_date);
CREATE INDEX idx_product_customer_visible ON vaccination_products(is_customer_visible, stock_quantity);
CREATE INDEX idx_product_orders_owner ON product_orders(owner_id);
CREATE INDEX idx_product_orders_status ON product_orders(status);

-- Default administrator account
-- Username: Admin
-- Password: 1234567890
INSERT INTO users (username, password, email, phone_number, role, account_status)
VALUES (
  'Admin',
  '$2y$10$cGjOoPUDP1LKWcVtNcs.me26Lbye4BG7y13.jaNcENkswOpHlVsne',
  'admin@vetclinic.com',
  '+1-800-VET-CLINIC',
  'Admin',
  'active'
);

SET FOREIGN_KEY_CHECKS = 1;
