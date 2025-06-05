# Product Requirements Document: Multi-Party Dispatch System Control Flow and Permissions

## 1. Overview
This PRD defines the control flow, permissions, and relationships between four parties—Broker, Customer, Leasor, and Driver—in the reintroduced "Dispatches" feature of an existing logistics application. It builds on the previously defined Dispatches feature, focusing on data visibility, permissions, and interactions to ensure secure and efficient coordination of material transport jobs. The system supports Leasors working with multiple Brokers while ensuring Brokers cannot access other Brokers' Leasors or Customers. The system leverages the existing tech stack, with implementation details at the discretion of the AI agent.

## 2. Objectives
- Define a clear **control flow** for dispatch creation, assignment, and status updates across Broker, Customer, Leasor, and Driver.
- Establish **role-based permissions** to ensure each party accesses only relevant data, with strict isolation between Brokers' Leasors and Customers.
- Support **real-time status updates** to keep all parties informed based on their roles.
- Enable scalability for Leasors working with multiple Brokers and future integrations (e.g., external communications).

## 3. Parties and Relationships
The system involves three company types and one individual role, with the following relationships:
- **Broker**: The central coordinator, managing relationships with their own Customers (excavation companies) and Leasors (truck-owning companies). Each Broker assigns dispatches to their contracted Leasors or their own trucks and has full visibility into their own jobs, statuses, and truck data (with enhanced details for Broker-owned trucks). Brokers cannot see Leasors or Customers associated with other Brokers.
- **Customer**: Excavation companies requesting material transport from their specific Broker. Customers can view status updates for their own jobs but not those of other Customers, even if served by the same Broker.
- **Leasor**: Companies leased by one or more Brokers to provide trucks. Leasors receive dispatch assignments from their contracted Brokers, assign them to their Drivers, and view job and status details for their trucks only, across all Brokers they work with. Leasors know the Customer name and Broker for each dispatch.
- **Driver**: Employees of Leasors (or Broker for Broker-owned trucks) who execute dispatches. Drivers view their assigned dispatch details and update delivery statuses.

### Control Flow Diagram
```
[Customer] ----(1. Requests job)----> [Broker]
   |                                     |
   |                                     |
   |                                     v
   |                            (2. Creates dispatch)
   |                                     |
   |                                     v
   |                            (3. Assigns to Leasor or Broker trucks)
   |                                     |
   |                                     v
   |                            [Leasor]
   |                                     |
   |                                     v
   |                            (4. Assigns to Driver)
   |                                     |
   |                                     v
   |                               [Driver]
   |                                     |
   |                                     v
   |                            (5. Updates status)
   |                                     |
   +----------------(6. Status updates pushed)----+
```

## 4. User Stories
- **As a Broker**, I want to create and assign dispatches to my contracted Leasors or my own trucks and view all my job and truck statuses, without seeing other Brokers’ Leasors or Customers, so I can manage my operations securely.
- **As a Customer**, I want to see real-time status updates for my jobs, but not other Customers’ jobs, so I can track progress without compromising privacy.
- **As a Leasor**, I want to receive and manage dispatch assignments from all Brokers I work with, assign them to my Drivers, and view statuses for my trucks, so I can manage my fleet effectively across multiple Brokers.
- **As a Driver**, I want to view only my assigned dispatch details and update delivery statuses, so I can focus on my tasks without unnecessary data.

## 5. Functional Requirements

### 5.1. Control Flow
1. **Job Request (Customer to Broker)**:
   - Customers submit material transport requests to their specific Broker via external channels (e.g., email, text). Currently out of scope but noted for future integration.
   - Broker inputs request details into the Dispatches page (see prior PRD for fields: Job Name, Date, Start Time, etc.), associating the dispatch with their Customer.

2. **Dispatch Creation (Broker)**:
   - Broker creates a dispatch in the Dispatches tab, linked to their Customer via a unique Broker-Customer relationship ID.
   - Dispatch details are stored in the database with a unique identifier, Broker ID, and Customer ID.

3. **Dispatch Assignment (Broker to Leasor or Broker Trucks)**:
   - Broker views available trucks from their contracted Leasors and their own fleet, filtered by truck type (e.g., Side Dump). Other Brokers’ Leasors are not visible.
   - Broker selects trucks (e.g., 2 from Leasor A, 1 from Leasor B, 2 from Broker’s fleet) to meet the job’s requirements.
   - Assignments are saved, linking dispatches to the Broker’s contracted Leasors or Broker-owned trucks.

4. **Driver Assignment (Leasor)**:
   - Leasor receives assigned dispatches from all Brokers they are contracted with, displayed in their dashboard with Broker and Customer names.
   - Leasor assigns dispatches to specific Drivers via a dropdown or list of available Drivers.
   - For Broker-owned trucks, the Broker assigns dispatches directly to Drivers.

5. **Dispatch Execution and Status Updates (Driver)**:
   - Driver views assigned dispatch details in the app (e.g., Material Type, GPS links).
   - Driver updates delivery status (e.g., “En Route,” “Delivered”) via existing app functionality.
   - Status updates are saved to the database and pushed to relevant parties.

6. **Status Visibility**:
   - Broker: Sees all status updates for their own dispatches and trucks, with enhanced data (e.g., maintenance logs, fuel usage) for Broker-owned trucks. Cannot see other Brokers’ Leasors or Customers.
   - Customer: Sees status updates for their jobs only, linked to their Broker.
   - Leasor: Sees status updates for their trucks, including job and dispatch details, across all Brokers they work with.
   - Driver: Sees only their assigned dispatch details and status update options.

### 5.2. Role-Based Permissions
- **Broker**:
  - **Read**: Their own dispatches, job details, truck statuses, contracted Leasors, and their Customers’ data. No access to other Brokers’ Leasors or Customers.
  - **Write**: Create/edit their dispatches, assign their contracted Leasors or own trucks, assign Drivers for Broker-owned trucks.
  - **Enhanced Access**: Full truck data (e.g., telemetry, maintenance) for Broker-owned trucks.
- **Customer**:
  - **Read**: Job details and status updates for their own jobs, linked to their Broker.
  - **Write**: None (requests submitted externally).
- **Leasor**:
  - **Read**: Dispatches and statuses for their trucks, associated Customer names, and Broker names for all Brokers they are contracted with.
  - **Write**: Assign dispatches to their Drivers.
- **Driver**:
  - **Read**: Assigned dispatch details (e.g., Material Type, GPS links).
  - **Write**: Update delivery status for their assigned dispatches.

### 5.3. Data Visibility and Privacy
- **Database Structure**:
  - **Dispatches**: Store job details (Job Name, Customer, Material Type, etc.), linked to a Customer ID and Broker ID.
  - **Broker-Leasor Relationships**: Store mappings of Leasors to their contracted Brokers, ensuring Leasors can work with multiple Brokers.
  - **Assignments**: Link dispatches to Leasors or Broker trucks, with Driver assignments.
  - **Statuses**: Store status updates with timestamps, linked to dispatches and Drivers.
- **Access Control**:
  - Use role-based access control (RBAC) to filter data by user role, Broker ID, and ownership.
  - Customer data is scoped to Customer ID and associated Broker ID.
  - Leasor data is scoped to their trucks and assigned dispatches, with visibility of all their contracted Brokers’ dispatches.
  - Driver data is scoped to their assigned dispatches.
  - Brokers are restricted to their own Leasors and Customers via Broker ID filtering.
- **Broker-Owned Trucks**:
  - Store additional metadata (e.g., maintenance records) accessible only to the owning Broker.
  - Ensure seamless integration with Leasor trucks in the assignment interface.

### 5.4. User Interfaces
- **Broker Dashboard**:
  - Dispatches tab for creating/editing dispatches, showing only their Customers and contracted Leasors.
  - Truck assignment interface showing only their contracted Leasors’ trucks and Broker-owned trucks.
  - Status dashboard with filters for their jobs, Customers, or trucks.
- **Customer Dashboard**:
  - Job status page showing only their jobs and statuses (e.g., “3 trucks en route, 2 delivered”), linked to their Broker.
  - Responsive design for desktop/tablet.
- **Leasor Dashboard**:
  - Dispatch list showing assigned jobs, Customer names, and Broker names for all contracted Brokers, with status updates.
  - Driver assignment interface with dropdowns for available Drivers.
- **Driver App**:
  - Existing functionality for viewing dispatch details and updating statuses.
  - Add dispatch selection dropdown to auto-populate fields.

## 6. Non-Functional Requirements
- **Performance**:
  - Status updates propagate to all relevant parties within 5 seconds.
  - Dashboards load in under 2 seconds with up to 1,000 active dispatches.
- **Scalability**:
  - Support 100 concurrent Brokers, 500 Customers, 200 Leasors (each potentially working with multiple Brokers), and 1,000 Drivers.
- **Security**:
  - Encrypt sensitive data (Customer names, GPS links) in transit and at rest.
  - Enforce RBAC to prevent unauthorized access (e.g., Broker viewing another Broker’s Leasors or Customers).
- **Usability**:
  - Intuitive dashboards with clear data filters (e.g., Leasor filtering by Broker).
  - Responsive design for all interfaces, prioritizing desktop and tablet.

## 7. Future Considerations
- **External Request Integration**: Parse Customer requests from email/text into the Dispatches form.
- **Enhanced Broker Truck Data**: Integrate real-time telemetry (e.g., GPS tracking) for Broker-owned trucks.
- **Notification System**: Push notifications for status updates (e.g., email or in-app alerts).
- **Leasor-Broker Onboarding**: Streamline adding new Broker-Leasor relationships in the app.

## 8. Assumptions
- Existing tech stack supports RBAC, real-time updates, and database queries for scoped data.
- Broker-owned trucks are already integrated with enhanced data fields.
- Driver app supports status updates and dispatch viewing.
- Broker-Leasor relationships are stored in the database with unique mappings.

## 9. Risks and Mitigations
- **Risk**: Data leakage between Brokers (e.g., seeing another Broker’s Leasors or Customers).
  - **Mitigation**: Implement strict RBAC with Broker ID filtering and audit database queries.
- **Risk**: Leasor dashboard confusion with multiple Brokers.
  - **Mitigation**: Add Broker-based filters and clear labeling of Broker names in the Leasor dashboard.
- **Risk**: Overloaded Broker dashboard with too many jobs.
  - **Mitigation**: Add pagination and filters (e.g., by Customer, date, or status).
- **Risk**: Driver confusion with dispatch selection.
  - **Mitigation**: Clear UI with single-select dropdown and confirmation before status updates.

## 10. Success Metrics
- **Broker Efficiency**: 95% of dispatches assigned within 5 minutes of creation.
- **Customer Satisfaction**: 90% of Customers report timely status updates (survey score 4/5).
- **Leasor Accuracy**: 98% of Driver assignments match intended dispatches across all Brokers.
- **Driver Usability**: 95% of Drivers use dispatch selection over manual entry.
