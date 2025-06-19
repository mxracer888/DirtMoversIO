#!/bin/bash

# Debug .env file and database connection
echo "🔍 Debugging .env file and database connection..."

echo "📄 Current .env file contents (passwords hidden):"
if [ -f .env ]; then
    sed 's/PASSWORD=.*/PASSWORD=***HIDDEN***/g' .env
else
    echo "❌ .env file not found!"
    exit 1
fi

echo ""
echo "🧪 Testing database connection components:"

# Extract values from .env
DB_USER=$(grep PGUSER .env | cut -d'=' -f2)
DB_NAME=$(grep PGDATABASE .env | cut -d'=' -f2)
DB_HOST=$(grep PGHOST .env | cut -d'=' -f2)
DB_PORT=$(grep PGPORT .env | cut -d'=' -f2)

echo "Database User: $DB_USER"
echo "Database Name: $DB_NAME"
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"

echo ""
echo "🔑 Testing connection with different methods:"

# Test 1: Basic connection
echo "Test 1: Basic PostgreSQL connection"
if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL server is running"
else
    echo "❌ PostgreSQL server is not responding"
fi

# Test 2: User exists
echo "Test 2: Check if user exists"
if sudo -u postgres psql -c "SELECT 1 FROM pg_user WHERE usename='$DB_USER';" | grep -q "1"; then
    echo "✅ User '$DB_USER' exists"
else
    echo "❌ User '$DB_USER' does not exist"
fi

# Test 3: Database exists
echo "Test 3: Check if database exists"
if sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" | grep -q "1"; then
    echo "✅ Database '$DB_NAME' exists"
else
    echo "❌ Database '$DB_NAME' does not exist"
fi

# Test 4: Manual connection test
echo "Test 4: Manual connection test"
echo "Testing connection manually (will prompt for password)..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>&1 | head -3

echo ""
echo "📝 To fix connection issues:"
echo "1. Check if your database password in .env is correct"
echo "2. Make sure the dirtmovers database exists"
echo "3. Verify user permissions are set correctly"