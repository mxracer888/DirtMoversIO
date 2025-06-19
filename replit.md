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
- June 18, 2025: Fixed dashboard crashes by removing problematic Mapbox integration that caused "require is not defined" errors
- June 18, 2025: Resolved authentication persistence issues by removing pre-loaded sample GPS data that was causing existing load data to appear on fresh logins
- June 18, 2025: Enhanced truck location component with user-friendly messaging explaining map functionality will be available in future updates
- June 18, 2025: Successfully implemented interactive Leaflet map with real GPS coordinates for truck tracking on broker dashboard
- June 18, 2025: Fixed authentication routing issues and verified login functionality with correct demo credentials (sarah.broker@terrafirma.com / broker123)
- June 19, 2025: Resolved driver dashboard blank page issue by adding proper loading states and missing API endpoints
- June 19, 2025: Fixed 504 Gateway Timeout and JSON parsing errors in login system
- June 19, 2025: Enhanced map component with fallback list view and error handling for improved reliability
- June 19, 2025: Fixed critical authentication failures by implementing PostgreSQL session store with connect-pg-simple
- June 19, 2025: Resolved React error #310 by removing conflicting useEffect hooks in driver interface
- June 19, 2025: Enhanced API error handling to prevent "undefined is not valid JSON" crashes

## User Preferences

Preferred communication style: Simple, everyday language.