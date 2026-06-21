@echo off
REM Veterinary System - Enhanced Features Setup Script (Windows)
REM This script creates necessary directories and sets permissions

echo.
echo ========================================
echo Veterinary System Setup
echo ========================================
echo.

REM Create upload directories
echo [1/3] Creating upload directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\pets" mkdir uploads\pets
if not exist "uploads\vets" mkdir uploads\vets
if not exist "uploads\owners" mkdir uploads\owners
if not exist "uploads\products" mkdir uploads\products

echo ✓ Upload directories created

REM Set permissions (Windows automatically inherits)
echo.
echo [2/3] Directories created with appropriate permissions
echo ✓ Permissions set

REM Display next steps
echo.
echo [3/3] Next Steps:
echo ========================================
echo.
echo 1. Run database enhancements:
echo    mysql -u root -p veterinary_clinic ^< database_enhancements.sql
echo.
echo 2. Update your config/db.php if needed with:
echo    - Database host
echo    - Database user
echo    - Database password
echo.
echo 3. Access new features:
echo    - Vaccinations: http://localhost/Final-project-Main-System/frontend/vaccinations-enhanced.html
echo    - Products:     http://localhost/Final-project-Main-System/frontend/products.html
echo    - Pets:         http://localhost/Final-project-Main-System/frontend/pets-enhanced.html
echo.
echo 4. Read ENHANCEMENTS.md for detailed documentation
echo.
echo ========================================
echo Setup Complete!
echo ========================================
pause
