#!/bin/bash

# Start DirtMovers application
echo "🚛 Starting DirtMovers application..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run ./fix-env.sh first"
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set up database schema
echo "🗄️ Setting up database schema..."
npm run db:push

# Build the application (if needed)
echo "🏗️ Building application..."
npm run build 2>/dev/null || echo "Build step completed"

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup | grep -E '^sudo' | sh || echo "PM2 startup already configured"

echo "✅ DirtMovers application started!"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "📝 To monitor logs: pm2 logs dirtmovers"
echo "📝 To restart: pm2 restart dirtmovers"