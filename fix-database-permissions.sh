#!/bin/bash

# Fix database permissions for DirtMovers deployment
echo "🔧 Fixing PostgreSQL permissions for dirtmovers user..."

# Grant all necessary permissions
sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO dirtmovers;" dirtmovers
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dirtmovers;" dirtmovers
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dirtmovers;" dirtmovers
sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dirtmovers;" dirtmovers
sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dirtmovers;" dirtmovers

# Test permissions
echo "🧪 Testing database connection..."
if psql postgresql://dirtmovers:$(grep PGPASSWORD .env | cut -d'=' -f2)@localhost:5432/dirtmovers -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database permissions fixed successfully!"
else
    echo "❌ Database connection still failing. Check your .env file and password."
fi