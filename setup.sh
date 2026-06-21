#!/bin/bash

# Veterinary System - Enhanced Features Setup Script
# Run: bash setup.sh

echo ""
echo "========================================"
echo "Veterinary System - Enhanced Setup"
echo "========================================"
echo ""

# Create upload directories
echo "[1/3] Creating upload directories..."
mkdir -p uploads/{pets,vets,owners,products}
chmod 755 uploads
chmod 755 uploads/pets uploads/vets uploads/owners uploads/products

echo "✓ Upload directories created"
echo ""

# Create .htaccess for web access (optional)
echo "[2/3] Creating .htaccess rules..."
cat > uploads/.htaccess << 'EOF'
<FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
    Allow from all
</FilesMatch>
EOF

echo "✓ .htaccess created"
echo ""

# Display next steps
echo "[3/3] Next Steps:"
echo "========================================"
echo ""
echo "1. Run database enhancements:"
echo "   mysql -u root -p veterinary_clinic < database_enhancements.sql"
echo ""
echo "2. Verify upload directory permissions:"
echo "   ls -la uploads/"
echo ""
echo "3. Update config/db.php if needed:"
echo "   - Database host"
echo "   - Database user"
echo "   - Database password"
echo ""
echo "4. Access new features:"
echo "   - Vaccinations: http://localhost/Final-project-Main-System/frontend/vaccinations-enhanced.html"
echo "   - Products:     http://localhost/Final-project-Main-System/frontend/products.html"
echo "   - Pets:         http://localhost/Final-project-Main-System/frontend/pets-enhanced.html"
echo ""
echo "5. Read ENHANCEMENTS.md for complete documentation"
echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
