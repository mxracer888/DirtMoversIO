#!/bin/bash

# Fix .env file configuration after deployment
echo "🔧 Fixing .env configuration..."

# Read database password
read -s -p "Enter your PostgreSQL password: " DB_PASSWORD
echo

# Read domain name
read -p "Enter your domain name (e.g., dirtmovers.yourdomain.com): " DOMAIN_NAME

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Create properly configured .env file
cat > .env << EOL
# Environment Configuration for DirtMovers
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://dirtmovers:${DB_PASSWORD}@localhost:5432/dirtmovers

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}

# PostgreSQL Connection Details
PGHOST=localhost
PGPORT=5432
PGUSER=dirtmovers
PGPASSWORD=${DB_PASSWORD}
PGDATABASE=dirtmovers

# Domain Configuration
DOMAIN=${DOMAIN_NAME}

# Security Settings
CORS_ORIGIN=https://${DOMAIN_NAME}
EOL

echo "✅ .env file configured successfully!"
echo "📝 Next steps:"
echo "1. Run: npm run db:push"
echo "2. Run: pm2 restart dirtmovers"
echo "3. Configure SSL: sudo certbot --nginx -d ${DOMAIN_NAME}"
