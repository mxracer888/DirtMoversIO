# 📄 Product Requirements Document (PRD)

### **Feature Name**: Lease Hauler (LH) Portal  
**Project**: DirtMovers  
**Prepared For**: Dev Agent / Development Team  
**Author**: Chase  
**Date**: June 2025  
**Version**: 1.0  

---

## 1. Overview

The purpose of this PRD is to define the scope, behavior, and data flow for the new **Lease Hauler (LH) Portal**, to be added to the existing DirtMovers platform. The LH portal will serve as an intermediary layer between the Broker and Driver portals, enabling third-party transportation companies (Lease Haulers) to manage dispatches, trucks, and drivers assigned by brokers.

This feature must **not alter or interrupt** existing functionality in the **Broker** or **Driver** portals.

---

## 2. Background

Currently, DirtMovers supports:
- **Driver Portal**: used by individual drivers to view dispatches and report End of Day (EOD) activities.
- **Broker Portal**: used by brokers to create and assign dispatches.

### Pain Point:
There is currently no formal workflow to route dispatches through external Lease Hauler companies who manage multiple drivers and trucks.

### Solution:
Build a **Lease Hauler Portal** which:
- Allows LH companies to receive and view assigned dispatches
- Enables LHs to assign dispatches to their own drivers
- Pushes assigned driver info back to the broker
- Ensures drivers receive only their assigned dispatches
- Tracks mid-day changes like truck swaps or slip-seat handoffs

---

## 3. Goals

| Goal | Description |
|------|-------------|
| Maintain system stability | Existing broker/driver flows remain fully functional |
| Introduce LH Portal | Enable companies to manage fleet and assign dispatches |
| Enable two-way visibility | Dispatch status visible to LHs and Brokers |
| Support real-world edge cases | Handle truck swaps, breakdowns, and slip-seating |

---

## 4. User Roles

| Role | Description |
|------|-------------|
| **Broker** | Creates dispatches and assigns to LHs |
| **Lease Hauler** | Company admin that manages fleet and assigns dispatches |
| **Driver (LH)** | Employee under LH company who receives assigned dispatches |

---

## 5. Functional Requirements

### 5.1 LH Portal Account

- LH company must be able to:
  - Register/log in via secure auth system
  - Maintain a profile with company info
  - Add/edit/delete trucks in their fleet
  - Add/edit/delete drivers and associate them with trucks

---

### 5.2 Dispatch Flow Integration

**Broker Portal:**
- No changes to how dispatches are created
- In “Manage Dispatches > Assign Trucks”, broker must:
  - View list of registered LH companies (with max truck availability)
  - Assign dispatch to LH via dropdown (existing UI behavior)
  - Specify number of trucks to assign
  - On confirm: send dispatch data to LH portal

**LH Portal:**
- Dashboard shows “Available Dispatches” received from brokers
- For each dispatch, LH can:
  - Assign a driver + truck combo
  - View dispatch details (material type, source, destination, etc.)
  - Accept or reject dispatch
- Once assignment is made, system pushes back:
  - Driver name
  - Truck type
  - Dispatch status = “Accepted”

**Driver Portal:**
- Upon login, driver sees:
  - Assigned dispatch for the day
  - Pre-populated project data
  - Can proceed with regular EOD workflow

---

### 5.3 Edge Case Handling

#### Truck Swap / Breakdown
- Driver must be able to:
  - Tap “Change Truck”
  - Select new truck from LH fleet
  - System logs truck swap and alerts broker
  - Loads before and after swap are attributed to the correct truck

#### Slip Seating
- Driver must be able to:
  - Tap “Transfer Driver”
  - Select another registered LH driver
  - Loads are logged to the new driver account
  - Day’s dispatch remains tied to a single truck, but load count segmented by driver
  - Broker is notified of change

---

## 6. Data Flow Overview

```
Broker → Creates Dispatch → Assigns to LH → LH Receives Dispatch → Assigns Truck + Driver → Driver Executes Dispatch → EOD Report → Shared with LH + Broker
```

### Key Data Tables to Add or Extend:
- `lease_hauler_companies`
- `lh_trucks`
- `lh_drivers`
- `dispatch_assignments` (linking LH → drivers → trucks → dispatch)
- `truck_swap_logs`
- `driver_handoff_logs`

---

## 7. Non-Functional Requirements

- Role-based access control across all portals
- Secure API communication between portals
- Real-time broker visibility of LH assignment status
- Mobile-responsiveness for LH and Driver UI
- Notifications (in-app or email) on:
  - New dispatch assigned
  - Driver/truck change
  - Slip-seat handoff
- Logs for traceability and audit

---

## 8. Success Criteria

| Metric | Target |
|--------|--------|
| Dispatch assignment success rate | 100% |
| EOD data syncing across all 3 portals | 100% accuracy |
| Driver/truck change propagation latency | < 5 seconds |
| Slip seat transitions tracked without data loss | Yes |
| No regressions in Broker/Driver portals | Confirmed via QA |

---

## 9. Scope Clarification

The following feature must remain active and unchanged:

- **GPS logging at dispatch milestones**, including:
  - At Load Site
  - Loaded
  - At Dump Site
  - Dumped Material

There are **no plans** for:
- Real-time GPS tracking
- Hardware sensor integrations

---

## 10. Confirmed Requirements & Clarifications

1. **Dispatch Acceptance / Rejection**
   - LHs can accept or reject a dispatch.
   - Rejections require a reason (e.g., “Driver called out”, “Truck broke”, “Declined project”)
   - All rejections are logged and may be used for future scoring metrics

2. **Assignment Timing**
   - Dispatches are generally created during the afternoon and assigned by LHs the evening before the workday.

3. **Broker Oversight**
   - Brokers do **not approve** assignments
   - System must report:
     - Driver Name
     - Truck Info
     - Assignment Timestamp

4. **Load Tracking**
   - The **Broker’s load tracking dashboard** showing "loads in transit" and "loads delivered" must remain intact and functional

---

## 11. Out of Scope

- Payment or billing features for LHs
- Driver time tracking beyond dispatch logs
- Real-time GPS or sensor-based monitoring

---
