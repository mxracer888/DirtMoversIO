# DirtMovers + Cloudflare Setup Guide

## Overview
Cloudflare provides excellent benefits for your DirtMovers application:
- Free SSL certificates and automatic HTTPS
- DDoS protection and security
- Global CDN for faster loading
- Analytics and monitoring
- Origin server protection (hides your Pi's IP)

## Cloudflare DNS Configuration

### Required DNS Records
```
Type  Name                    Content                 Proxy Status
A     dirtmovers              YOUR_PI_PUBLIC_IP       Proxied (Orange Cloud)
A     www.dirtmovers          YOUR_PI_PUBLIC_IP       Proxied (Orange Cloud)
CNAME api.dirtmovers          dirtmovers.yourdomain.com  Proxied (Orange Cloud)
```

### SSL/TLS Settings
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **"Full (strict)"**
3. Enable **"Always Use HTTPS"**
4. Enable **"Automatic HTTPS Rewrites"**

## Nginx Configuration for Cloudflare

Update your Nginx config to work with Cloudflare:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Real IP from Cloudflare
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2c0f:f248::/32;
    set_real_ip_from 2a06:98c0::/29;
    real_ip_header CF-Connecting-IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## Cloudflare Page Rules (Optional)
Create these page rules for optimization:

1. **Cache Everything**
   - URL: `your-domain.com/static/*`
   - Settings: Cache Level = Cache Everything, Edge Cache TTL = 1 month

2. **Security Level**
   - URL: `your-domain.com/api/*`
   - Settings: Security Level = High

## Firewall Rules
Restrict access to your Pi by allowing only Cloudflare IPs:

```bash
# Update UFW to allow only Cloudflare IPs
sudo ufw --force reset

# Allow SSH (be careful with this)
sudo ufw allow ssh

# Allow Cloudflare IP ranges
for ip in 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 104.16.0.0/13 104.24.0.0/14 108.162.192.0/18 131.0.72.0/22 141.101.64.0/18 162.158.0.0/15 172.64.0.0/13 173.245.48.0/20 188.114.96.0/20 190.93.240.0/20 197.234.240.0/22 198.41.128.0/17; do
    sudo ufw allow from $ip to any port 80
    sudo ufw allow from $ip to any port 443
done

sudo ufw --force enable
```

## Environment Variables Update
Update your `.env` file to work with Cloudflare:

```env
# Domain Configuration
DOMAIN=your-domain.com
CORS_ORIGIN=https://your-domain.com

# Trust Cloudflare proxy
TRUST_PROXY=true
```

## Application Configuration
Update your Express server to trust Cloudflare proxy:

Add to `server/index.ts`:
```javascript
// Trust Cloudflare proxy
app.set('trust proxy', 1);

// Handle CF-Connecting-IP header
app.use((req, res, next) => {
  if (req.headers['cf-connecting-ip']) {
    req.connection.remoteAddress = req.headers['cf-connecting-ip'];
  }
  next();
});
```

## Benefits You'll Get

1. **Free SSL** - No need for Let's Encrypt on your Pi
2. **DDoS Protection** - Cloudflare handles attacks
3. **Performance** - Global CDN caches content
4. **Analytics** - Detailed traffic insights
5. **Security** - Bot protection and firewall
6. **Origin Protection** - Your Pi's IP stays hidden

## Setup Steps

1. **Add domain to Cloudflare**
2. **Update nameservers** at your domain registrar
3. **Configure DNS records** (proxied)
4. **Set SSL mode** to Full (strict)

### Authenticated Origin Pulls Setup
5. **Run origin pulls setup:**
   ```bash
   ./setup-cloudflare-origin-pulls.sh
   ```

6. **Generate Cloudflare Origin Certificate:**
   - Go to SSL/TLS → Origin Server in Cloudflare dashboard
   - Click "Create Certificate"
   - Select "Let Cloudflare generate a private key and a CSR"
   - Choose 15-year validity
   - Add your hostnames (your-domain.com, *.your-domain.com)
   - Copy the certificate and private key

7. **Install the certificates:**
   ```bash
   # Replace with your Cloudflare-issued certificate
   sudo nano /etc/nginx/cloudflare/cert.pem
   # Replace with your Cloudflare-issued private key
   sudo nano /etc/nginx/cloudflare/key.pem
   ```

8. **Enable Authenticated Origin Pulls in Cloudflare:**
   - Go to SSL/TLS → Origin Server
   - Enable "Authenticated Origin Pulls"

9. **Update Nginx configuration:**
   ```bash
   sudo cp cloudflare-nginx.conf /etc/nginx/sites-available/dirtmovers
   sudo nginx -t
   sudo systemctl reload nginx
   ```

10. **Configure firewall** to allow only Cloudflare
11. **Test your application**

## Monitoring
Use Cloudflare Analytics to monitor:
- Traffic patterns
- Security threats blocked
- Performance metrics
- Origin server health

Your Raspberry Pi will be well-protected behind Cloudflare while maintaining full functionality!