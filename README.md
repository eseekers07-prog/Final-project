# Veterinary Clinic Management System

A PHP, MySQL, and vanilla JavaScript veterinary clinic system for managing users, pets, appointments, health records, vaccinations, products, invoices, and online payment records.

## Requirements

- XAMPP or another Apache + PHP stack
- PHP 7.4+ with PDO MySQL enabled
- MySQL 5.7+ or MariaDB
- Modern browser

## Quick Start

1. Start Apache and MySQL from XAMPP.
2. Import the database:

```bash
mysql -u root -p < schema.sql
```

3. Optional: add sample data:

```bash
php seed.php
```

4. Open the app:

```text
http://localhost/Final-project-Main-System/frontend/login.html
```

Default administrator:

```text
Username: Admin
Password: 1234567890
```

## Database Configuration

The default database name is `veterinary_clinic`. You can change credentials in `backend/config/db.php` or set environment variables:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=veterinary_clinic
DB_USER=root
DB_PASS=
```

## Features

- Role based access for Admin, Veterinarian, and PetOwner
- Pet owner registration and admin account setup
- Pet, veterinarian, appointment, health record, vaccination, and product management
- Customer product ordering with delivery or pickup
- Invoice creation and payment tracking
- Online payment record workflow with generated receipt references
- Secure sessions, password hashing, and prepared SQL statements

## Online Payment Note

The included online payment flow validates card-style input, records an approved transaction, stores only the last four card digits, and marks the invoice as paid. It is suitable for a final-project demo. A real production payment gateway such as PayHere, Stripe, or PayPal still requires merchant keys and gateway webhook integration.

## Useful URLs

```text
Login:          http://localhost/Final-project-Main-System/frontend/login.html
Dashboard:      http://localhost/Final-project-Main-System/frontend/dashboard.html
Products:       http://localhost/Final-project-Main-System/frontend/products.html
Invoices:       http://localhost/Final-project-Main-System/frontend/invoices.html
Admin Panel:    http://localhost/Final-project-Main-System/frontend/admin-panel.html
```

## Troubleshooting

- Database connection failed: confirm MySQL is running and `veterinary_clinic` exists.
- Login fails: re-import `schema.sql` or run `php seed.php`, then clear browser cookies.
- Fetch or network errors: open the project through Apache, not directly from the file system.
- Blank icons/styles: internet access is needed for the Tailwind and Lucide CDNs used by the frontend.
