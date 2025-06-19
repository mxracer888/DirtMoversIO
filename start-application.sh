#!/bin/bash

# Start DirtMovers Application
echo "🚀 Starting DirtMovers Application..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run deploy.sh first."
    exit 1
fi

# Fix DATABASE_URL encoding if needed
if [ -f fix-env-url-encoding.sh ]; then
    echo "🔧 Fixing DATABASE_URL encoding..."
    ./fix-env-url-encoding.sh
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Push database schema
echo "🗄️ Setting up database..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Database setup failed"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed - dist/index.js not found"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Stop any existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop dirtmovers 2>/dev/null || true
pm2 delete dirtmovers 2>/dev/null || true

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs

if [ $? -eq 0 ]; then
    echo "✅ Application started successfully!"
    pm2 save
    pm2 status
    echo ""
    echo "🌐 Application should be running on http://localhost:3000"
    echo "📊 Check logs with: pm2 logs dirtmovers"
    echo "🔄 Restart with: pm2 restart dirtmovers"
    echo "🛑 Stop with: pm2 stop dirtmovers"
else
    echo "❌ Failed to start application"
    echo "📋 Check logs with: pm2 logs dirtmovers"
    exit 1
fi