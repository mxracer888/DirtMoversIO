# DirtMovers - Dump Truck Logistics Management System

## Overview

DirtMovers is a comprehensive logistics management platform designed specifically for dump truck operations. The system tracks four key activity timestamps (arrive at load site, loaded with material, arrive at dump site, dumped material) to enable accurate billing and provide efficiency analytics for fleet management. The application is built as a mobile-first Progressive Web App (PWA) with both driver and broker interfaces.

## System Architecture

The application follows a full-stack TypeScript architecture with the following key components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming for trucking industry branding
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile Optimization**: Touch-friendly interfaces with PWA capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with TypeScript validation using Zod schemas

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Schema Design**: Comprehensive trucking operations schema including users, companies, trucks, jobs, activities, and work days
- **Time-Series Optimization**: Prepared for TimescaleDB extension for activity tracking analytics
- **Data Integrity**: Foreign key relationships and constraints for data consistency

## Key Components

### Driver Interface (`client/src/pages/driver/`)
- **Daily Setup**: Job assignment and truck selection interface
- **Main Activity**: Core activity logging with GPS tracking and undo functionality
- **Activity History**: Real-time activity timeline with load tracking
- **End of Day**: Digital signature capture and shift completion

### Broker Dashboard (`client/src/pages/broker/`)
- **Real-time Monitoring**: Live fleet tracking with activity feeds
- **Dispatch Management**: Job creation and truck assignment system
- **Employee Management**: User role and permission management
- **Analytics Dashboard**: Performance metrics and efficiency tracking

### Activity State Management (`client/src/lib/activity-states.ts`)
- **Four-Stage Workflow**: Complete dump truck operation cycle
- **State Transitions**: Enforced sequential activity progression
- **Undo Functionality**: Sophisticated activity cancellation and state rewind
- **Break Management**: Support for breaks and breakdown reporting

### GPS and Location Services (`client/src/hooks/use-geolocation.ts`)
- **High-Accuracy Positioning**: GPS coordinate capture for all activities
- **Error Handling**: Comprehensive geolocation error management
- **Mobile Optimization**: Touch-friendly location services for field use

## Data Flow

1. **Authentication**: Session-based authentication with role-based access control
2. **Work Day Initialization**: Drivers start shifts by selecting truck and job assignments
3. **Activity Logging**: GPS-enabled activity tracking through four-stage workflow
4. **Real-time Updates**: Live activity feeds for broker monitoring
5. **Load Data Capture**: Ticket numbers and weight tracking for billing
6. **Signature Capture**: Digital signatures for shift completion and load verification
7. **Analytics Processing**: Activity data aggregation for performance metrics

## External Dependencies

### Production Dependencies
- **Database**: PostgreSQL with planned TimescaleDB extension for time-series data
- **Authentication**: Express sessions with connect-pg-simple for PostgreSQL session store
- **Validation**: Zod schemas for runtime type checking and API validation
- **UI Framework**: React with shadcn/ui component system
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting

### Development Dependencies
- **Build System**: Vite with TypeScript compilation
- **Database Migrations**: Drizzle Kit for schema migrations
- **Development Server**: Express with hot module replacement

## Deployment Strategy

### Target Environment
- **Primary Deployment**: Raspberry Pi 5 with 16GB RAM for in-truck installation
- **Backup Environment**: Standard Linux servers or cloud platforms
- **Database**: PostgreSQL 16 with TimescaleDB extension for analytics

### Production Configuration
- **Session Storage**: PostgreSQL-backed sessions for scalability
- **Static Assets**: Vite-built client served by Express
- **Environment Variables**: Database connection strings and session secrets
- **Process Management**: PM2 or similar for production process management

### Build Process
1. Client build with Vite (`npm run build`)
2. Server bundling with esbuild
3. Database schema deployment with Drizzle migrations
4. Static asset optimization and compression

## Changelog
- June 14, 2025: Initial setup
- June 14, 2025: Fixed dispatch persistence issue by updating role-based access control to include broker_admin role in dispatch retrieval logic
- June 19, 2025: Resolved EOD data persistence issue by switching from memory-based to database-based storage
- June 19, 2025: Fixed authentication system with proper bcrypt password hashing implementation
- June 19, 2025: EOD submission flow fully operational with persistent data storage
- June 19, 2025: Fixed critical EOD submission bug - resolved 400 "invalid update data" error by improving Date object handling and type validation in updateWorkDay method
- June 19, 2025: Database query issues systematically resolved - added missing imports, corrected column references, and fixed complex join queries for broker dashboard
- June 19, 2025: Fixed JSON parsing errors causing constant popups on broker dashboard with comprehensive error handling
- June 19, 2025: Enhanced session authentication for improved mobile and desktop compatibility
- June 19, 2025: Database reset to clean state for presentation - removed all previous demo data (activities, work days, dispatches)
- June 19, 2025: Complete Raspberry Pi deployment configuration added with custom domain support, SSL setup, and production optimization
- June 19, 2025: Fixed DATABASE_URL encoding for passwords with special characters, resolved PostgreSQL permissions, and corrected PM2 configuration format

## User Preferences

Preferred communication style: Simple, everyday language.