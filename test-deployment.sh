#!/bin/bash

# Test DirtMovers deployment and connectivity
echo "🧪 Testing DirtMovers deployment..."

# Check if application is running
echo "1. Checking if Node.js application is running..."
if pm2 list | grep -q "dirtmovers.*online"; then
    echo "✅ DirtMovers application is running"
else
    echo "❌ DirtMovers application is not running"
    echo "Starting application..."
    pm2 start ecosystem.config.js
fi

# Check if nginx is running and configured
echo "2. Checking Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running - starting it..."
    sudo systemctl start nginx
fi

# Test local application connectivity
echo "3. Testing local application..."
if curl -s http://localhost:3000/health > /dev/null || curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application responds locally on port 3000"
else
    echo "❌ Application not responding on port 3000"
    echo "Checking PM2 logs..."
    pm2 logs dirtmovers --lines 10
fi

# Test nginx proxy
echo "4. Testing Nginx proxy..."
if curl -s -k https://localhost > /dev/null; then
    echo "✅ Nginx HTTPS proxy working"
else
    echo "❌ Nginx HTTPS proxy not responding"
fi

# Check database connection
echo "5. Testing database connection..."
if psql -h localhost -U dirtmovers -d dirtmovers -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed"
    echo "Check your DATABASE_URL in .env file"
fi

# Check firewall status
echo "6. Checking firewall status..."
sudo ufw status

# Show current processes
echo "7. Current application status:"
pm2 status

echo ""
echo "🌐 Your application should now be accessible at:"
echo "   https://your-domain.com"
echo ""
echo "📝 If site doesn't load, check:"
echo "   1. DNS records point to your Pi's public IP"
echo "   2. Cloudflare proxy is enabled (orange cloud)"
echo "   3. Cloudflare SSL mode is 'Full (strict)'"
echo "   4. Authenticated Origin Pulls is enabled"
echo ""