# DirtMovers - Dump Truck Logistics Management System

A comprehensive logistics management platform for dump truck operations, designed for mobile-first usage with a broker dashboard interface.

## Overview

DirtMovers (DirtMovers.io) is a specialized application that helps trucking companies track their dump truck operations through four key activity timestamps:

1. **Arrive at Load Site** - Driver logs arrival at material pickup location
2. **Loaded with Material** - Driver confirms truck is loaded and ready to transport
3. **Arrive at Dump Site** - Driver logs arrival at material delivery location  
4. **Dumped Material** - Driver confirms material has been dumped and load is complete

This tracking enables accurate billing to customers and provides valuable efficiency analytics for fleet management.

## Architecture

- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Optimized for Raspberry Pi 5 with 16GB RAM
- **Mobile**: Progressive Web App (PWA) optimized for mobile devices

## Features

### Driver Interface
- Mobile-optimized activity logging with GPS coordinates
- Real-time location tracking during work shifts
- Simple one-tap activity buttons with visual feedback
- Work day management with load counting
- Offline capability for remote job sites

### Broker Dashboard
- Real-time monitoring of all active drivers and trucks
- Live activity feeds and GPS tracking
- Job management and assignment
- Fleet efficiency analytics
- Customer and material management

### Core Capabilities
- Multi-company support with role-based access
- GPS coordinate logging for all activities
- Comprehensive audit trail for billing purposes
- Future-ready for QuickBooks Online integration
- Designed for Raspberry Pi deployment in trucks

## Technology Stack

### Frontend Dependencies
- React 18 with TypeScript
- Wouter for routing
- TanStack Query for state management
- shadcn/ui component library
- Tailwind CSS for styling
- Lucide React for icons

### Backend Dependencies
- Express.js with session management
- Drizzle ORM with PostgreSQL
- Zod for data validation
- TypeScript throughout

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Git for version control

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd dirt-movers
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Database connection is pre-configured for Replit
# Additional secrets can be added as needed
```

4. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment

### Raspberry Pi 5 Deployment
The application is optimized for deployment on Raspberry Pi 5 devices with the following specifications:
- 16GB RAM
- RaspberryPiOS
- Network connectivity for GPS and data sync
- Power management for mobile truck installations

### Database Migration
Use Drizzle commands for database management:
```bash
npm run db:push  # Push schema changes to database
npm run db:studio  # Open database management interface
```

## Project Structure

```
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
├── server/               # Express backend application
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database interface layer
│   └── types.ts          # TypeScript type definitions
├── shared/               # Shared code between frontend/backend
│   └── schema.ts         # Database schema and types
└── attached_assets/      # Project documentation and mockups
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Activities
- `POST /api/activities` - Log new activity
- `GET /api/activities/recent` - Get recent activities

### Work Days
- `POST /api/workdays` - Start new work day
- `GET /api/workdays/active` - Get active work day for driver

## Development Guidelines

### TypeScript
- Strict type checking enabled
- Shared types between frontend and backend
- Drizzle-generated types for database operations

### Code Organization
- Component-based React architecture
- Custom hooks for business logic
- Centralized API client with React Query

### Database Design
- Designed for future QuickBooks integration
- Comprehensive audit trail for billing
- GPS coordinate tracking for all activities
- Multi-company and role-based access

## Future Enhancements

1. **QuickBooks Integration** - Automated invoice generation
2. **Native Mobile Apps** - iOS and Android applications
3. **Advanced Analytics** - Fleet efficiency reporting
4. **Real-time Notifications** - Push notifications for critical events
5. **Route Optimization** - AI-powered route planning

## Contributing

This project follows standard Git workflows. Key development practices:
- Feature branch development
- Comprehensive testing before deployment
- TypeScript strict mode compliance
- Mobile-first responsive design

## License

Proprietary - DirtMovers.io Platform

## Support

For technical support or feature requests, contact the development team.