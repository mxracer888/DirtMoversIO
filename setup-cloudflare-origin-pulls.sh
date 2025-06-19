#!/bin/bash

# Cloudflare Authenticated Origin Pulls Setup Script
# This script sets up the certificates needed for Cloudflare Origin Pulls

set -e

echo "🔒 Setting up Cloudflare Authenticated Origin Pulls..."

# Create Cloudflare directory
sudo mkdir -p /etc/nginx/cloudflare

# Download Cloudflare Origin CA certificate
echo "📥 Downloading Cloudflare Origin CA certificate..."
sudo curl -o /etc/nginx/cloudflare/origin-pull-ca.pem https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem

# Generate origin certificate and key (will be replaced with Cloudflare-issued cert)
echo "🔑 Generating temporary self-signed certificate..."
sudo openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com" \
    -keyout /etc/nginx/cloudflare/key.pem \
    -out /etc/nginx/cloudflare/cert.pem

# Set proper permissions
sudo chmod 600 /etc/nginx/cloudflare/key.pem
sudo chmod 644 /etc/nginx/cloudflare/cert.pem
sudo chmod 644 /etc/nginx/cloudflare/origin-pull-ca.pem

echo "✅ Cloudflare Origin Pulls certificates ready!"
echo ""
echo "📝 Next steps:"
echo "1. In Cloudflare dashboard: SSL/TLS → Origin Server → Create Certificate"
echo "2. Replace /etc/nginx/cloudflare/cert.pem with Cloudflare certificate"
echo "3. Replace /etc/nginx/cloudflare/key.pem with Cloudflare private key"
echo "4. Enable 'Authenticated Origin Pulls' in SSL/TLS → Origin Server"
echo "5. Update and restart Nginx: sudo systemctl reload nginx"
echo ""
echo "🔐 Your origin server will now only accept connections from Cloudflare!"