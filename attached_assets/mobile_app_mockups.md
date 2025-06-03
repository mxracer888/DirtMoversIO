# TerraFirma Mobile App UI Mockups

## Overview

The TerraFirma mobile app is designed for dump truck drivers to log their activities throughout the workday. The interface prioritizes simplicity, ease of use, and efficiency, with large buttons that can be easily tapped even in work environments.

## Screen Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Login Screen   │────►│  Daily Setup    │────►│  Main Activity  │
│                 │     │                 │     │     Screen      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  End of Day     │◄────│  Activity       │◄────│  Event Button   │
│  Signature      │     │  History        │     │     Cycle       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Screen Designs

### 1. Login Screen

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    TerraFirma                       │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │               [Company Logo]                │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Email                                      │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Password                                   │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │                 LOGIN                       │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Forgot Password?                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Simple email/password login
- Company logo for branding
- Forgot password option
- Support for biometric login after initial setup

### 2. Daily Setup Screen

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ← Back                      Daily Setup            │
│                                                     │
│  Work Date: [04/25/2025]                           │
│                                                     │
│  Truck Information                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ Truck Number                              ▼ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Truck Type                                ▼ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Job Information                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ Customer                                   ▼ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Job Name                                  ▼ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Material Information                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ Material Type                             ▼ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Material Source                           ▼ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Delivery Location                         ▼ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │                 START DAY                   │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Date selection (defaults to current date)
- Dropdown selectors for all fields
- Pre-populated options from broker dispatch instructions
- Ability to select from available dispatches
- Large, easy-to-tap START DAY button

### 3. Main Activity Screen

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Menu ☰           Active Job: Jordan River Heights  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Current Status: En Route to Load Site      │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  │         ARRIVED AT LOAD SITE                │   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Today's Activity:                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Loads Completed: 5                         │   │
│  │  Last Load Time: 9:45 AM                    │   │
│  │  Average Cycle Time: 32 min                 │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │             VIEW HISTORY                    │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │             END DAY                         │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Large, prominent action button for the current event
- Button text changes based on the cycle:
  1. ARRIVED AT LOAD SITE
  2. LOADED WITH MATERIAL
  3. ARRIVED AT DUMP SITE
  4. DUMPED MATERIAL
- Current status indicator
- Today's activity summary
- Access to activity history
- END DAY button for shift completion

### 4. Event Button Cycle Variations

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Menu ☰           Active Job: Jordan River Heights  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Current Status: At Load Site               │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  │         LOADED WITH MATERIAL                │   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Menu ☰           Active Job: Jordan River Heights  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Current Status: En Route to Dump Site      │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  │         ARRIVED AT DUMP SITE                │   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Menu ☰           Active Job: Jordan River Heights  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Current Status: At Dump Site               │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  │         DUMPED MATERIAL                     │   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5. Activity History Screen

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ← Back                    Activity History         │
│                                                     │
│  Today: April 25, 2025                              │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Load #5                                     │   │
│  │ ─────────────────────────────────────────── │   │
│  │ Arrived at Load Site:    10:15 AM           │   │
│  │ Loaded with Material:    10:22 AM (7m wait) │   │
│  │ Arrived at Dump Site:    10:42 AM           │   │
│  │ Dumped Material:         10:47 AM (5m wait) │   │
│  │ Total Cycle Time: 32 minutes                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Load #4                                     │   │
│  │ ─────────────────────────────────────────── │   │
│  │ Arrived at Load Site:    9:40 AM            │   │
│  │ Loaded with Material:    9:45 AM (5m wait)  │   │
│  │ Arrived at Dump Site:    10:05 AM           │   │
│  │ Dumped Material:         10:10 AM (5m wait) │   │
│  │ Total Cycle Time: 30 minutes                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Load #3                                     │   │
│  │ ─────────────────────────────────────────── │   │
│  │ Arrived at Load Site:    9:05 AM            │   │
│  │ Loaded with Material:    9:15 AM (10m wait) │   │
│  │ Arrived at Dump Site:    9:35 AM            │   │
│  │ Dumped Material:         9:38 AM (3m wait)  │   │
│  │ Total Cycle Time: 33 minutes                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                      [More...]                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Chronological list of completed loads
- Timestamps for each event
- Wait time calculations
- Total cycle time per load
- Scrollable history

### 6. End of Day Signature Screen

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ← Back                    End of Day               │
│                                                     │
│  Daily Summary:                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Total Loads: 8                             │   │
│  │  Start Time: 7:00 AM                        │   │
│  │  End Time: 3:45 PM                          │   │
│  │  Total Time: 8h 45m                         │   │
│  │  Average Cycle Time: 31 minutes             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Operator Signature:                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ Operator Name:                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │             CLEAR SIGNATURE                 │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │             COMPLETE                        │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Daily activity summary
- Operator name input field
- Digital signature pad
- Clear signature option
- Complete button to finalize the day

### 7. Side Menu

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ☰ Close                                            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  John Smith                                 │   │
│  │  Truck #123                                 │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Current Job                                │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Activity History                           │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Settings                                   │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Help                                       │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Logout                                     │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Driver and truck information
- Navigation to main app sections
- Settings access
- Help documentation
- Logout option

## Mobile App Design Considerations

### 1. Usability
- Large, easy-to-tap buttons for drivers who may be wearing gloves or working in challenging conditions
- High contrast colors for outdoor visibility
- Simple, focused interface with one primary action at a time
- Minimal text input requirements

### 2. Offline Functionality
- Local storage of event data when offline
- Background synchronization when connectivity is restored
- Visual indicators for sync status

### 3. GPS Accuracy
- GPS accuracy indicator
- Option to manually adjust location if GPS is inaccurate
- Geofencing for automatic event suggestions when arriving at known locations

### 4. Battery Optimization
- Efficient GPS usage to minimize battery drain
- Background processing optimizations
- Power-saving mode for extended shifts

### 5. Accessibility
- Support for device accessibility features
- Voice commands for hands-free operation (future enhancement)
- Haptic feedback for button presses

### 6. Error Handling
- Clear error messages
- Automatic retry for failed API calls
- Conflict resolution for offline data synchronization

### 7. Notifications
- Shift start/end reminders
- Synchronization status alerts
- Optional broker messages
