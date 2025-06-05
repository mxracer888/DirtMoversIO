# Product Requirements Document: Dispatches Feature for Broker Dashboard

## 1. Overview
This PRD outlines the requirements for reintroducing and enhancing the "Dispatches" page on the broker dashboard of an existing logistics application. The feature aims to streamline the process of receiving, managing, and assigning dispatch requests for material transport, ensuring efficient allocation of resources to leased companies and their drivers. The feature aligns with the existing tech stack, with implementation details left to the discretion of the AI agent.

## 2. Objectives
- **Reinstate the Dispatches page** to allow brokers to input, manage, and assign dispatch jobs.
- **Enhance usability** by incorporating reusable data (e.g., dropdowns with add functionality) and GPS integration.
- **Support scalability** for future external communication integration (e.g., email/text).
- **Ensure seamless driver experience** by pre-populating dispatch details in the driver interface.

## 3. User Stories
- **As a broker**, I want to input dispatch details efficiently, reusing common data like job names, material types, and customer details, so I can save time and reduce errors.
- **As a broker**, I want to assign trucks from leased companies to jobs based on availability and requirements, so I can ensure all jobs are adequately resourced.
- **As a driver**, I want to select a dispatch from a list to auto-populate job details, so I can start my workday quickly and accurately.
- **As a leased company**, I want to receive clear dispatch instructions from the broker, so I can assign them to my drivers effectively.

## 4. Functional Requirements

### 4.1. Dispatches Page on Broker Dashboard
- **Navigation**: Add a "Dispatches" tab to the broker dashboard, accessible via the main navigation menu.
- **Input Form**: Create a form to capture dispatch details with the following fields:
  - **Job Name**: Text input for internal identification (e.g., "Smith Quarry Job"). Supports reuse for recurring jobs.
  - **Date**: Date picker for selecting the job date.
  - **Start Time**: Time picker for job start time.
  - **Truck Type and Quantity**: Dropdown for truck type (e.g., "Side Dump," "Flatbed") and numeric input for quantity required (e.g., 5).
  - **Invoice Job Name**: Text input for customer-facing job name used for invoicing.
  - **Material Type**: Dropdown menu with predefined material types (e.g., "Gravel," "Sand"). Include an "Add New" option to save new materials to the dropdown for future use.
  - **Material From**: Hybrid input:
    - Dropdown for reusable locations (e.g., common pits like "North Quarry").
    - Text input for one-off locations.
    - Option to save new reusable locations to the dropdown.
  - **Delivered To**: Same as Material From (hybrid dropdown/text input with save functionality).
  - **Customer**: Dropdown of existing customers (e.g., excavation companies) with an "Add New" option to save new customers to the database.
  - **Account**: Dropdown mirroring Customer field for consistency, with add functionality.
  - **Travel Time**: Numeric input (in minutes, e.g., 45) for paid travel time. Must be a number datatype for summation in driver hours calculations.
  - **Material From GPS Pin**: Text input for a Google Maps link to the material source location.
  - **Delivered To GPS Pin**: Text input for a Google Maps link to the delivery location.
- **Form Validation**:
  - Required fields: Job Name, Date, Start Time, Truck Type, Quantity, Material Type, Material From, Delivered To, Customer, Travel Time.
  - GPS links must be valid URLs (optional validation for Google Maps format).
  - Travel Time must be a positive number.
- **Save and Reuse**: Store reusable fields (Job Name, Material Type, Material From, Delivered To, Customer, Account) in the database for future dropdown selections.

### 4.2. Resource Allocation
- **Truck Assignment Interface**:
  - Display a list of leased companies with their available trucks, filtered by truck type (e.g., Side Dump).
  - For each job, show the required number of trucks and allow selection via radio buttons or checkboxes.
  - Example: For a job requiring 5 Side Dumps, show:
    - Company 1: 2 Side Dumps (select 0, 1, or 2).
    - Company 2: 1 Side Dump (select 0 or 1).
    - Company 3: 2 Side Dumps (select 0, 1, or 2).
  - Validate that the total selected trucks match the required quantity before submission.
- **Assignment Submission**:
  - Submit dispatch instructions to selected leased companies.
  - Store assignments in the database, linking jobs to companies and their trucks.

### 4.3. Driver Interface Integration
- **Dispatch Selection**:
  - In the driver app, provide a dropdown or list of assigned dispatches.
  - Selecting a dispatch auto-populates fields (Material Type, Material From, Delivered To, GPS links, etc.) to override manual entry.
- **GPS Integration**:
  - Display GPS links as clickable buttons that open Google Maps in a new tab or app (depending on device).
  - optional feature to add a simple mapbox integration that renders a tile with the GPS pin on it so the driver can quickly view the location on a map in app
- **Permissions**:
  - Drivers only see dispatches assigned to their leased company.
  - Drivers cannot edit dispatch details but can view all relevant fields.
  - Occasionally drivers are asked to switch materials delivered in a given day, i.e. switch from Road Base to Sand and thus need the ability to change materials for future loads

### 4.4. Leased Company Workflow
- **Dispatch Receipt**:
  - Leased companies receive notifications of assigned dispatches (implementation TBD, e.g., in-app or email).
  - Provide a view of dispatch details (same fields as broker input).
- **Driver Assignment**:
  - Allow leased companies to assign dispatches to specific drivers via a simple interface (e.g., dropdown of available drivers).
  - Update dispatch status to reflect driver assignment.

## 5. Non-Functional Requirements
- **Performance**: Page load time for the Dispatches tab should be under 2 seconds with up to 1,000 dispatch records.
- **Scalability**: Support up to 100 concurrent brokers and 1,000 daily dispatches.
- **Usability**:
  - Intuitive form layout with clear labels and tooltips for GPS link fields.
  - Responsive design for desktop and tablet use (mobile optional).
- **Security**:
  - Role-based access control: Brokers can create/edit dispatches; leased companies can view/assign; drivers can only view.
  - Encrypt GPS links and customer data in transit and at rest.
- **Data Persistence**:
  - Store all dispatch data, including reusable dropdown values, in the existing database.
  - Ensure travel time is stored as a numeric value for calculations.

## 6. Future Considerations
- **External Communication Integration**:
  - Support for receiving dispatch requests via email or text, with parsing into the Dispatches form.
- **Analytics Dashboard**:
  - Leverage the current dashboard we have and enahnce it with some data from dispatch as needed

## 7. Assumptions
- The existing tech stack supports form inputs, dropdowns, database storage, and role-based permissions.
- Google Maps links are provided by brokers manually; no API integration is required for this phase.
- Leased companies and drivers are already onboarded in the system with defined roles.

## 8. Risks and Mitigations
- **Risk**: Dropdowns become unwieldy with too many reusable entries.
  - **Mitigation**: Implement search/filter functionality for dropdowns and periodic cleanup of unused entries.
- **Risk**: Incorrect truck assignments due to unclear availability.
  - **Mitigation**: Display real-time truck availability and prevent over-allocation through validation.
- **Risk**: Driver app performance degrades with many dispatches.
  - **Mitigation**: Paginate dispatch lists and optimize queries for driver-facing views.

## 9. Success Metrics
- **Broker Efficiency**: 90% of dispatch entries completed in under 2 minutes.
- **Driver Adoption**: 95% of drivers use pre-populated dispatch data instead of manual entry.
- **Error Rate**: Less than 1% of dispatches require re-assignment due to incorrect truck allocation.

