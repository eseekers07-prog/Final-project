-- Veterinary Clinic Management System - Enhancements
-- Add photo upload support and products management

USE veterinary_clinic;

-- Add photo columns to existing tables
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) NULL;
ALTER TABLE veterinarians ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) NULL;
ALTER TABLE pet_owners ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) NULL;

-- Vaccination Products Table
DROP TABLE IF EXISTS vaccination_products;
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

ALTER TABLE vaccination_products
ADD COLUMN IF NOT EXISTS is_customer_visible TINYINT(1) NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS requires_prescription TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_available TINYINT(1) NOT NULL DEFAULT 1;

-- Update Vaccinations table to reference products
ALTER TABLE vaccinations 
ADD COLUMN IF NOT EXISTS product_id INT UNSIGNED NULL,
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS notes TEXT NULL,
ADD CONSTRAINT fk_vacc_product FOREIGN KEY (product_id) REFERENCES vaccination_products(product_id) ON DELETE SET NULL;

-- Add photos column for product images
DROP TABLE IF EXISTS product_photos;
CREATE TABLE product_photos (
  photo_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (photo_id),
  CONSTRAINT fk_photo_product FOREIGN KEY (product_id) REFERENCES vaccination_products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customer online ordering and delivery
CREATE TABLE IF NOT EXISTS payment_transactions (
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

CREATE TABLE IF NOT EXISTS product_orders (
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

CREATE TABLE IF NOT EXISTS product_order_items (
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

-- Add indexes for better performance
CREATE INDEX idx_pets_photo ON pets(photo_url);
CREATE INDEX idx_vets_photo ON veterinarians(photo_url);
CREATE INDEX idx_owners_photo ON pet_owners(photo_url);
CREATE INDEX idx_vacc_product ON vaccinations(product_id);
CREATE INDEX idx_payment_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_user ON payment_transactions(user_id);
CREATE INDEX idx_vacc_due_date ON vaccinations(next_due_date);
CREATE INDEX idx_product_expiry ON vaccination_products(expiry_date);
CREATE INDEX idx_product_customer_visible ON vaccination_products(is_customer_visible, stock_quantity);
CREATE INDEX idx_product_orders_owner ON product_orders(owner_id);
CREATE INDEX idx_product_orders_status ON product_orders(status);
