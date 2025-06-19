# Manual Git Push Instructions

Your DirtMovers application is complete with Raspberry Pi deployment configuration and ready to be pushed to your existing DirtMoversIO repository. Due to git lock files in the Replit environment, you'll need to push manually.

## Option 1: Use Replit's Shell
1. Open the Shell tab in Replit
2. Run these commands one by one:
   ```bash
   rm -f .git/index.lock .git/config.lock
   git remote add origin https://github.com/mxracer888/DirtMoversIO.git
   git add .
   git commit -m "Fixed database driver for local PostgreSQL connection"
   git push -u origin main
   ```

## Option 2: Download and Push from Local Machine
1. Download your entire Replit project
2. On your local machine, navigate to the project folder
3. Run these commands:
   ```bash
   git init
   git remote add origin https://github.com/mxracer888/DirtMoversIO.git
   git add .
   git commit -m "Complete multi-party dispatch system with broker/leasor management"
   git push -u origin main
   ```

## What's Included in This Commit:
- Complete multi-party dispatch control flow (Customer → Broker → Leasor → Driver)
- Working dispatch management with truck assignments and role-based access
- Four-stage activity workflow with GPS tracking and cycle time calculations
- Mobile-optimized driver interface with PWA capabilities
- Broker dashboard with real-time activity monitoring
- Enhanced authentication system with session persistence
- PostgreSQL database with comprehensive relationships and data integrity
- **Raspberry Pi 5 Deployment Configuration:**
  - Complete deployment guide with system optimization
  - Nginx configuration with SSL support
  - PM2 process management setup
  - PostgreSQL optimization for Pi hardware
  - Custom domain configuration
  - Security hardening and monitoring setup
- **Production Environment:**
  - Environment configuration templates
  - Automated backup scripts
  - System monitoring and logging
  - Performance optimization for 16GB Pi 5
- Database reset functionality for clean presentations
- Comprehensive error handling and data validation
- All production deployment files and configurations

## Key Files:
- `shared/schema.ts` - Database schema and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Data storage interface
- `client/src/pages/driver/main-activity.tsx` - Main driver interface
- `client/src/pages/driver/activity-history.tsx` - Activity tracking
- `client/src/lib/activity-states.ts` - Business logic for activity flow

The application is fully functional and ready for deployment.