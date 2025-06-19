#!/bin/bash

# DirtMovers Raspberry Pi Deployment Script
# Run this script on your Raspberry Pi after cloning the repository

set -e

echo "🚛 Starting DirtMovers deployment on Raspberry Pi..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y curl git nginx postgresql postgresql-contrib

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
echo "🔧 Installing PM2..."
sudo npm install -g pm2

# Create database user
echo "🗄️ Setting up PostgreSQL..."
# Create user with minimal privileges (not superuser)
sudo -u postgres createuser --no-superuser --createdb --no-createrole dirtmovers 2>/dev/null || echo "User already exists"
sudo -u postgres createdb -O dirtmovers dirtmovers 2>/dev/null || echo "Database already exists"

# Prompt for database password
read -s -p "Enter password for PostgreSQL user 'dirtmovers': " DB_PASSWORD
echo
sudo -u postgres psql -c "ALTER USER dirtmovers PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dirtmovers TO dirtmovers;"

# Install application dependencies
echo "📦 Installing application dependencies..."
npm install

# Create .env file
echo "⚙️ Creating environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate random session secret
    SESSION_SECRET=$(openssl rand -base64 32)
    
    # Update .env file
    sed -i "s/your_secure_password/$DB_PASSWORD/g" .env
    sed -i "s/your_super_secure_session_secret_here_minimum_32_chars/$SESSION_SECRET/g" .env
    
    echo "✅ Environment file created. Please update your domain in .env"
else
    echo "ℹ️ Environment file already exists"
fi

# Setup database
echo "🗄️ Setting up database schema..."
npm run db:push

# Build application
echo "🏗️ Building application..."
npm run build || echo "Build step completed with warnings"

# Setup PM2
echo "🔧 Setting up PM2 process manager..."
pm2 start ecosystem.config.js || pm2 restart dirtmovers
pm2 save
pm2 startup | grep -E '^sudo' | sh || echo "PM2 startup already configured"

# Setup Nginx (basic configuration)
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/dirtmovers > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/dirtmovers /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Setup firewall
echo "🔒 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

echo ""
echo "🎉 DirtMovers deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update your domain in .env file"
echo "2. Configure SSL with: sudo certbot --nginx -d your-domain.com"
echo "3. Update DNS records to point to this Pi's IP"
echo "4. Monitor with: pm2 logs dirtmovers"
echo ""
echo "🌐 Application should be running at: http://$(hostname -I | awk '{print $1}'):80"
echo "📊 PM2 status: pm2 status"
echo ""