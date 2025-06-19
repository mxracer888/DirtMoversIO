# DirtMovers - Raspberry Pi 5 Deployment Guide

## Overview
Deploy your DirtMovers logistics management system to Raspberry Pi 5 (16GB RAM) with custom domain configuration.

## Prerequisites
- Raspberry Pi 5 with 16GB RAM
- Fresh Raspberry Pi OS installation
- Custom domain name configured
- Internet connection
- SSH access to Pi

## Step 1: System Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql postgresql-contrib
```

### Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install PM2 for Process Management
```bash
sudo npm install -g pm2
```

## Step 2: PostgreSQL Setup

### Configure PostgreSQL
```bash
sudo -u postgres createuser --interactive
# Create user: dirtmovers
# Make superuser: y

sudo -u postgres createdb dirtmovers
sudo -u postgres psql -c "ALTER USER dirtmovers PASSWORD 'your_secure_password';"
```

### Configure PostgreSQL for remote connections (optional)
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

## Step 3: Application Deployment

### Clone Repository
```bash
cd /home/pi
git clone https://github.com/mxracer888/DirtMoversIO.git
cd DirtMoversIO
```

### Install Dependencies
```bash
npm install
```

### Environment Configuration
```bash
cp .env.example .env
nano .env
```

Configure your `.env` file:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://dirtmovers:your_secure_password@localhost:5432/dirtmovers
SESSION_SECRET=your_super_secure_session_secret_here
```

### Database Setup
```bash
npm run db:push
```

### Build Application
```bash
npm run build
```

## Step 4: Nginx Configuration

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/dirtmovers
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (after obtaining certificates)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

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
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (if serving separately)
    location /static/ {
        alias /home/pi/DirtMoversIO/client/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/dirtmovers /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: SSL Certificate Setup

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Auto-renewal
```bash
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 6: Process Management

### Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'dirtmovers',
    script: 'server/index.js',
    cwd: '/home/pi/DirtMoversIO',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/dirtmovers-error.log',
    out_file: '/var/log/pm2/dirtmovers-out.log',
    log_file: '/var/log/pm2/dirtmovers.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    autorestart: true,
    watch: false
  }]
};
```

### Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 7: System Optimization for Pi 5

### Configure Memory Split
```bash
sudo nano /boot/config.txt
# Add: gpu_mem=128
```

### Optimize PostgreSQL for Pi
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Add optimizations:
```
# Memory settings for Pi 5 16GB
shared_buffers = 2GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 64MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Restart Services
```bash
sudo systemctl restart postgresql
sudo reboot
```

## Step 8: Monitoring and Maintenance

### Log Monitoring
```bash
# Application logs
pm2 logs dirtmovers

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -f -u nginx
journalctl -f -u postgresql
```

### Database Backup Script
```bash
nano /home/pi/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/pi/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U dirtmovers dirtmovers > $BACKUP_DIR/dirtmovers_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "dirtmovers_*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/pi/backup-db.sh
crontab -e
# Add: 0 2 * * * /home/pi/backup-db.sh
```

## Step 9: Firewall Configuration

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (if remote access needed)
sudo ufw enable
```

## Step 10: Domain Configuration

### DNS Records
Configure these DNS records with your domain provider:

```
A     your-domain.com      YOUR_PI_PUBLIC_IP
A     www.your-domain.com  YOUR_PI_PUBLIC_IP
```

### Router Configuration
- Port forward 80 and 443 to your Pi's local IP
- Consider setting up Dynamic DNS if your IP changes

## Troubleshooting

### Common Issues

1. **Port 3000 in use**: Check `sudo netstat -tulpn | grep :3000`
2. **Database connection failed**: Verify PostgreSQL is running and credentials are correct
3. **Nginx 502 error**: Check if Node.js application is running with `pm2 status`
4. **SSL certificate issues**: Run `sudo certbot renew --dry-run`

### Performance Monitoring
```bash
# System resources
htop
iostat -x 1

# Application performance
pm2 monit

# Database performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

## Security Considerations

1. **Change default passwords** for all services
2. **Keep system updated** with regular `apt update && apt upgrade`
3. **Monitor logs** for suspicious activity
4. **Use strong SSL configuration** 
5. **Consider fail2ban** for brute force protection
6. **Regular backups** of both database and application files

## Production Checklist

- [ ] System updated and secured
- [ ] PostgreSQL configured with strong password
- [ ] Application deployed and running
- [ ] Nginx configured with SSL
- [ ] Domain pointing to Pi
- [ ] PM2 managing application process
- [ ] Automated backups configured
- [ ] Monitoring and logging in place
- [ ] Firewall rules configured
- [ ] Performance optimizations applied

Your DirtMovers application should now be running on your Raspberry Pi with your custom domain!