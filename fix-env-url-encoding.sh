#!/bin/bash

# Fix DATABASE_URL encoding for special characters in password
echo "🔧 Fixing DATABASE_URL encoding..."

if [ ! -f .env ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Extract password from .env
DB_PASSWORD=$(grep PGPASSWORD .env | cut -d'=' -f2)

# URL encode the password
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$DB_PASSWORD', safe=''))")

# Update DATABASE_URL with encoded password
sed -i "s|DATABASE_URL=postgresql://dirtmovers:.*@localhost:5432/dirtmovers|DATABASE_URL=postgresql://dirtmovers:$ENCODED_PASSWORD@localhost:5432/dirtmovers|g" .env

echo "✅ DATABASE_URL updated with properly encoded password"

# Test the connection
echo "🧪 Testing database connection..."
if npm run db:push > /dev/null 2>&1; then
    echo "✅ Database connection working!"
else
    echo "❌ Database connection still failing"
    echo "Trying alternative encoding method..."
    
    # Alternative method using node.js
    node -e "
    const fs = require('fs');
    const password = '$DB_PASSWORD';
    const encoded = encodeURIComponent(password);
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(
        /DATABASE_URL=postgresql:\/\/dirtmovers:.*@localhost:5432\/dirtmovers/,
        \`DATABASE_URL=postgresql://dirtmovers:\${encoded}@localhost:5432/dirtmovers\`
    );
    fs.writeFileSync('.env', envContent);
    console.log('DATABASE_URL updated with Node.js encoding');
    " 2>/dev/null || echo "Node.js encoding failed, manual fix needed"
fi