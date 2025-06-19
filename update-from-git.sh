#!/bin/bash

# Update DirtMovers from Git repository
# This script safely updates your deployment from the latest Git version

set -e

echo "🔄 Updating DirtMovers from Git repository..."

# Stop the application if running
if pm2 list | grep -q "dirtmovers.*online"; then
    echo "⏹️ Stopping current application..."
    pm2 stop dirtmovers || echo "Application was not running"
fi

# Backup current .env file
if [ -f .env ]; then
    echo "💾 Backing up current .env file..."
    cp .env .env.backup
fi

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Restore .env file if it exists
if [ -f .env.backup ]; then
    echo "♻️ Restoring environment configuration..."
    mv .env.backup .env
fi

# Update dependencies if package.json changed
if git diff HEAD~1 HEAD --name-only | grep -q "package.*json"; then
    echo "📦 Updating dependencies..."
    npm install
fi

# Create logs directory if missing
mkdir -p logs

# Update database schema
echo "🗄️ Updating database schema..."
npm run db:push

# Restart application
echo "🚀 Restarting application..."
pm2 start ecosystem.config.cjs || pm2 restart dirtmovers

# Show status
echo "📊 Application status:"
pm2 status

echo "✅ Update completed successfully!"
echo "🌐 Your application should be accessible at your domain"