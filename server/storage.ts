import { 
  users, trucks, jobs, customers, materials, locations, workDays, activities, companies,
  dispatches, dispatchAssignments, brokerLeasorRelationships, reusableData,
  type User, type InsertUser, type Truck, type InsertTruck, type Job, type InsertJob,
  type Customer, type InsertCustomer, type Material, type InsertMaterial, 
  type Location, type InsertLocation, type WorkDay, type InsertWorkDay,
  type Activity, type InsertActivity, type Company, type InsertCompany,
  type Dispatch, type InsertDispatch, type DispatchAssignment, type InsertDispatchAssignment,
  type BrokerLeasorRelationship, type InsertBrokerLeasorRelationship,
  type ReusableData, type InsertReusableData
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  
  // Trucks
  getTrucks(): Promise<Truck[]>;
  getTrucksByCompany(companyId: number): Promise<Truck[]>;
  createTruck(truck: InsertTruck): Promise<Truck>;
  
  // Jobs
  getJobs(): Promise<Job[]>;
  getActiveJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Materials
  getMaterials(): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  
  // Locations
  getLocations(): Promise<Location[]>;
  getLocationsByType(type: string): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Work Days
  getWorkDay(id: number): Promise<WorkDay | undefined>;
  getActiveWorkDayByDriver(driverId: number): Promise<WorkDay | undefined>;
  getActiveWorkDays(): Promise<WorkDay[]>;
  getCompletedWorkDays(): Promise<Array<WorkDay & { driver: User; truck: Truck; job: Job; totalActivities: number }>>;
  createWorkDay(workDay: InsertWorkDay): Promise<WorkDay>;
  updateWorkDay(id: number, updates: Partial<WorkDay>): Promise<WorkDay | undefined>;
  
  // Activities
  getActivitiesByWorkDay(workDayId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined>;
  getRecentActivities(limit?: number): Promise<Array<Activity & { driver: User; truck: Truck; job: Job }>>;
  
  // Dispatches
  getDispatches(brokerId?: number): Promise<Dispatch[]>;
  getDispatch(id: number): Promise<Dispatch | undefined>;
  createDispatch(dispatch: InsertDispatch): Promise<Dispatch>;
  updateDispatch(id: number, updates: Partial<Dispatch>): Promise<Dispatch | undefined>;
  getDispatchesByCustomer(customerId: number): Promise<Dispatch[]>;
  
  // Dispatch Assignments
  getDispatchAssignments(dispatchId?: number, driverId?: number): Promise<DispatchAssignment[]>;
  createDispatchAssignment(assignment: InsertDispatchAssignment): Promise<DispatchAssignment>;
  updateDispatchAssignment(id: number, updates: Partial<DispatchAssignment>): Promise<DispatchAssignment | undefined>;
  getDispatchAssignmentsByLeasor(leasorId: number): Promise<Array<DispatchAssignment & { dispatch: Dispatch; truck: Truck }>>;
  
  // Broker-Leasor Relationships
  getBrokerLeasorRelationships(brokerId?: number, leasorId?: number): Promise<BrokerLeasorRelationship[]>;
  createBrokerLeasorRelationship(relationship: InsertBrokerLeasorRelationship): Promise<BrokerLeasorRelationship>;
  updateBrokerLeasorRelationship(id: number, updates: Partial<BrokerLeasorRelationship>): Promise<BrokerLeasorRelationship | undefined>;
  
  // Reusable Data
  getReusableData(type: string, brokerId: number): Promise<ReusableData[]>;
  createReusableData(data: InsertReusableData): Promise<ReusableData>;
  updateReusableDataUsage(id: number): Promise<void>;
  
  // Role-based access helpers
  getCustomersByBroker(brokerId: number): Promise<Customer[]>;
  getTrucksByBroker(brokerId: number): Promise<Array<Truck & { company: Company }>>;
  getLeasorsByBroker(brokerId: number): Promise<Company[]>;
  
  // Employee management
  getEmployeesByCompany(companyId: number): Promise<User[]>;
  createEmployee(employee: InsertUser): Promise<User>;
  updateEmployee(id: number, updates: Partial<User>): Promise<User | undefined>;
  deactivateEmployee(id: number): Promise<User | undefined>;
  
  // Company management
  getCompaniesByType(type: string): Promise<Company[]>;
  getCompanyById(id: number): Promise<Company | undefined>;
  
  // Lease Hauler Portal methods
  getUsersByCompany(companyId: number): Promise<User[]>;
  getDispatchesByCompany(companyId: number): Promise<Dispatch[]>;
  getActivitiesByCompany(companyId: number, date: Date): Promise<Activity[]>;
  updateTruck(id: number, updates: Partial<Truck>): Promise<Truck | undefined>;
  deleteTruck(id: number): Promise<void>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  createUserInvitation(invitation: {
    email: string;
    name: string;
    role: string;
    companyId: number;
    invitedBy: number;
  }): Promise<any>;
  getPendingInvitationsByCompany(companyId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private companies: Map<number, Company> = new Map();
  private trucks: Map<number, Truck> = new Map();
  private jobs: Map<number, Job> = new Map();
  private customers: Map<number, Customer> = new Map();
  private materials: Map<number, Material> = new Map();
  private locations: Map<number, Location> = new Map();
  private workDays: Map<number, WorkDay> = new Map();
  private activities: Map<number, Activity> = new Map();
  private dispatches: Map<number, Dispatch> = new Map();
  private dispatchAssignments: Map<number, DispatchAssignment> = new Map();
  private brokerLeasorRelationships: Map<number, BrokerLeasorRelationship> = new Map();
  private reusableData: Map<number, ReusableData> = new Map();
  private userInvitations: Map<number, any> = new Map();
  
  private currentUserId = 1;
  private currentCompanyId = 1;
  private currentTruckId = 1;
  private currentJobId = 1;
  private currentCustomerId = 1;
  private currentMaterialId = 1;
  private currentLocationId = 1;
  private currentWorkDayId = 1;
  private currentActivityId = 1;
  private currentDispatchId = 1;
  private currentDispatchAssignmentId = 1;
  private currentBrokerLeasorRelationshipId = 1;
  private currentReusableDataId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create sample company
    const company: Company = {
      id: this.currentCompanyId++,
      name: "TerraFirma Logistics",
      type: "broker",
      contactEmail: "info@terrafirma.com",
      contactPhone: "(555) 123-4567",
      address: "123 Industrial Blvd, Salt Lake City, UT 84101",
      createdAt: new Date(),
    };
    this.companies.set(company.id, company);

    // Create sample leasor and customer companies
    const leasorCompany: Company = {
      id: this.currentCompanyId++,
      name: "Mountain Trucking LLC",
      type: "leasor",
      contactEmail: "dispatch@mountaintrucking.com",
      contactPhone: "(555) 234-5678",
      address: "456 Transport Way, Salt Lake City, UT 84102",
      createdAt: new Date(),
    };
    this.companies.set(leasorCompany.id, leasorCompany);

    const customerCompany: Company = {
      id: this.currentCompanyId++,
      name: "Pivot Excavating",
      type: "customer",
      contactEmail: "office@pivotexcavating.com",
      contactPhone: "(555) 345-6789",
      address: "789 Construction Blvd, West Valley, UT 84119",
      createdAt: new Date(),
    };
    this.companies.set(customerCompany.id, customerCompany);

    // Create sample users with multiple employees per company
    const users: User[] = [
      // Broker company employees
      {
        id: this.currentUserId++,
        email: "sarah.broker@terrafirma.com",
        password: "broker123",
        name: "Sarah Wilson",
        role: "broker_admin",
        companyId: company.id,
        brokerId: null,
        permissions: "admin",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentUserId++,
        email: "john.dispatch@terrafirma.com",
        password: "dispatch123",
        name: "John Martinez",
        role: "broker_employee",
        companyId: company.id,
        brokerId: null,
        permissions: "basic",
        isActive: true,
        createdAt: new Date(),
      },
      // Leasor company employees
      {
        id: this.currentUserId++,
        email: "mike.johnson@mountaintrucking.com",
        password: "driver123",
        name: "Mike Johnson",
        role: "driver",
        companyId: leasorCompany.id,
        brokerId: company.id, // Linked to broker
        permissions: "basic",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentUserId++,
        email: "lisa.manager@mountaintrucking.com",
        password: "leasor123",
        name: "Lisa Chen",
        role: "leasor_admin",
        companyId: leasorCompany.id,
        brokerId: company.id, // Linked to broker
        permissions: "admin",
        isActive: true,
        createdAt: new Date(),
      },
      // Customer company employees
      {
        id: this.currentUserId++,
        email: "david.supervisor@pivotexcavating.com",
        password: "customer123",
        name: "David Rodriguez",
        role: "customer_admin",
        companyId: customerCompany.id,
        brokerId: company.id, // Linked to broker
        permissions: "admin",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentUserId++,
        email: "anna.coordinator@pivotexcavating.com",
        password: "coord123",
        name: "Anna Thompson",
        role: "customer_employee",
        companyId: customerCompany.id,
        brokerId: company.id, // Linked to broker
        permissions: "basic",
        isActive: true,
        createdAt: new Date(),
      },
    ];
    
    // Create broker-leasor relationship
    const brokerLeasorRel: BrokerLeasorRelationship = {
      id: this.currentBrokerLeasorRelationshipId++,
      brokerId: company.id,
      leasorId: leasorCompany.id,
      isActive: true,
      createdAt: new Date(),
    };
    this.brokerLeasorRelationships.set(brokerLeasorRel.id, brokerLeasorRel);
    users.forEach(user => this.users.set(user.id, user));

    // Create sample customers
    const customers: Customer[] = [
      {
        id: this.currentCustomerId++,
        name: "Pivot Excavating",
        contactEmail: "contact@pivotexcavating.com",
        contactPhone: "(555) 234-5678",
        address: "456 Construction Ave, West Valley, UT 84119",
        createdAt: new Date(),
      },
      {
        id: this.currentCustomerId++,
        name: "Mountain View Construction",
        contactEmail: "info@mountainview.com",
        contactPhone: "(555) 345-6789",
        address: "789 Mountain Rd, Riverton, UT 84065",
        createdAt: new Date(),
      },
    ];
    customers.forEach(customer => this.customers.set(customer.id, customer));

    // Create sample trucks
    const trucks: Truck[] = [
      {
        id: this.currentTruckId++,
        number: "T-105",
        type: "Side Dump",
        companyId: company.id,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentTruckId++,
        number: "T-108",
        type: "End Dump",
        companyId: company.id,
        isActive: true,
        createdAt: new Date(),
      },
    ];
    trucks.forEach(truck => this.trucks.set(truck.id, truck));

    // Create sample jobs
    const jobs: Job[] = [
      {
        id: this.currentJobId++,
        name: "Jordan River Heights",
        customerId: customers[0].id,
        startDate: new Date(),
        endDate: null,
        status: "active",
        description: "Residential development project",
        createdAt: new Date(),
      },
      {
        id: this.currentJobId++,
        name: "Riverton Commons",
        customerId: customers[1].id,
        startDate: new Date(),
        endDate: null,
        status: "active",
        description: "Commercial development",
        createdAt: new Date(),
      },
    ];
    jobs.forEach(job => this.jobs.set(job.id, job));

    // Create sample materials
    const materials: Material[] = [
      {
        id: this.currentMaterialId++,
        name: "A1A Fill",
        type: "A1A",
        pricePerLoad: "150.00",
        createdAt: new Date(),
      },
      {
        id: this.currentMaterialId++,
        name: "State Spec Road Base",
        type: "State Spec Road Base",
        pricePerLoad: "175.00",
        createdAt: new Date(),
      },
    ];
    materials.forEach(material => this.materials.set(material.id, material));

    // Create sample locations
    const locations: Location[] = [
      {
        id: this.currentLocationId++,
        name: "Kilgore West Valley Mine",
        address: "1234 Mining Rd, West Valley, UT 84119",
        latitude: "40.7589",
        longitude: "-111.9389",
        type: "source",
        createdAt: new Date(),
      },
      {
        id: this.currentLocationId++,
        name: "Jordan River Heights Site",
        address: "5678 Development Blvd, South Jordan, UT 84095",
        latitude: "40.5621",
        longitude: "-111.9291",
        type: "destination",
        createdAt: new Date(),
      },
    ];
    locations.forEach(location => this.locations.set(location.id, location));

    // Create completed work days for EOD testing
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const completedWorkDay: WorkDay = {
      id: this.currentWorkDayId++,
      driverId: users[2].id, // Mike Johnson
      truckId: trucks[0].id,
      jobId: jobs[0].id,
      workDate: yesterday.toISOString().split('T')[0],
      status: "completed",
      startTime: new Date(yesterday.getTime() + 7 * 60 * 60 * 1000), // 7 AM yesterday
      endTime: new Date(yesterday.getTime() + 16 * 60 * 60 * 1000), // 4 PM yesterday
      totalLoads: 8,
      driverSignature: "Mike Johnson",
      operatorName: "Mike Johnson",
      operatorSignature: "MJ",
      createdAt: yesterday,
    };
    this.workDays.set(completedWorkDay.id, completedWorkDay);

    // Create activities for the completed work day
    const completedActivities: Activity[] = [];
    for (let load = 1; load <= 3; load++) {
      const baseTime = new Date(yesterday.getTime() + 8 * 60 * 60 * 1000); // Start at 8 AM
      const loadStartTime = new Date(baseTime.getTime() + (load - 1) * 90 * 60 * 1000); // 90 min cycles
      
      // Arrive at load site
      completedActivities.push({
        id: this.currentActivityId++,
        workDayId: completedWorkDay.id,
        loadNumber: load,
        activityType: "arrived_at_load_site",
        timestamp: new Date(loadStartTime.getTime()),
        latitude: "40.7589",
        longitude: "-111.9389",
        notes: `Load ${load} - Arrived at Kilgore West Valley Mine`,
        ticketNumber: null,
        netWeight: null,
        cancelled: false,
        cancelledAt: null,
        createdAt: new Date(loadStartTime.getTime()),
      });

      // Loaded with material
      completedActivities.push({
        id: this.currentActivityId++,
        workDayId: completedWorkDay.id,
        loadNumber: load,
        activityType: "loaded_with_material",
        timestamp: new Date(loadStartTime.getTime() + 15 * 60 * 1000), // 15 min later
        latitude: "40.7589",
        longitude: "-111.9389",
        notes: `Load ${load} - Loaded with dirt material`,
        ticketNumber: `TK${yesterday.getDate()}${load.toString().padStart(3, '0')}`,
        netWeight: (18 + Math.random() * 4).toFixed(1), // 18-22 tons
        cancelled: false,
        cancelledAt: null,
        createdAt: new Date(loadStartTime.getTime() + 15 * 60 * 1000),
      });

      // Arrive at dump site
      completedActivities.push({
        id: this.currentActivityId++,
        workDayId: completedWorkDay.id,
        loadNumber: load,
        activityType: "arrived_at_dump_site",
        timestamp: new Date(loadStartTime.getTime() + 45 * 60 * 1000), // 45 min later
        latitude: "40.5621",
        longitude: "-111.9291",
        notes: `Load ${load} - Arrived at Jordan River Heights Site`,
        ticketNumber: null,
        netWeight: null,
        cancelled: false,
        cancelledAt: null,
        createdAt: new Date(loadStartTime.getTime() + 45 * 60 * 1000),
      });

      // Dumped material
      completedActivities.push({
        id: this.currentActivityId++,
        workDayId: completedWorkDay.id,
        loadNumber: load,
        activityType: "dumped_material",
        timestamp: new Date(loadStartTime.getTime() + 60 * 60 * 1000), // 60 min later
        latitude: "40.5621",
        longitude: "-111.9291",
        notes: `Load ${load} - Material dumped successfully`,
        ticketNumber: null,
        netWeight: null,
        cancelled: false,
        cancelledAt: null,
        createdAt: new Date(loadStartTime.getTime() + 60 * 60 * 1000),
      });
    }

    // Add EOD activity
    completedActivities.push({
      id: this.currentActivityId++,
      workDayId: completedWorkDay.id,
      loadNumber: 0,
      activityType: "end_of_day",
      timestamp: completedWorkDay.endTime!,
      latitude: "40.5621",
      longitude: "-111.9291",
      notes: "Work day completed by Mike Johnson",
      ticketNumber: null,
      netWeight: null,
      cancelled: false,
      cancelledAt: null,
      createdAt: completedWorkDay.endTime!,
    });

    completedActivities.forEach(activity => this.activities.set(activity.id, activity));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
      role: insertUser.role ?? "driver",
      companyId: insertUser.companyId ?? null,
    };
    this.users.set(user.id, user);
    return user;
  }

  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const company: Company = {
      ...insertCompany,
      id: this.currentCompanyId++,
      createdAt: new Date(),
      address: insertCompany.address ?? null,
      contactEmail: insertCompany.contactEmail ?? null,
      contactPhone: insertCompany.contactPhone ?? null,
    };
    this.companies.set(company.id, company);
    return company;
  }

  // Trucks
  async getTrucks(): Promise<Truck[]> {
    return Array.from(this.trucks.values());
  }

  async getTrucksByCompany(companyId: number): Promise<Truck[]> {
    return Array.from(this.trucks.values()).filter(truck => truck.companyId === companyId);
  }

  async createTruck(insertTruck: InsertTruck): Promise<Truck> {
    const truck: Truck = {
      ...insertTruck,
      id: this.currentTruckId++,
      createdAt: new Date(),
      isActive: insertTruck.isActive ?? null,
    };
    this.trucks.set(truck.id, truck);
    return truck;
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getActiveJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.status === "active");
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const job: Job = {
      ...insertJob,
      id: this.currentJobId++,
      createdAt: new Date(),
      status: insertJob.status ?? null,
      startDate: insertJob.startDate ?? null,
      endDate: insertJob.endDate ?? null,
      description: insertJob.description ?? null,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const customer: Customer = {
      ...insertCustomer,
      id: this.currentCustomerId++,
      createdAt: new Date(),
      address: insertCustomer.address ?? null,
      contactEmail: insertCustomer.contactEmail ?? null,
      contactPhone: insertCustomer.contactPhone ?? null,
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const material: Material = {
      ...insertMaterial,
      id: this.currentMaterialId++,
      createdAt: new Date(),
      pricePerLoad: insertMaterial.pricePerLoad ?? null,
    };
    this.materials.set(material.id, material);
    return material;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocationsByType(type: string): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(location => location.type === type);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const location: Location = {
      ...insertLocation,
      id: this.currentLocationId++,
      createdAt: new Date(),
      address: insertLocation.address ?? null,
      latitude: insertLocation.latitude ?? null,
      longitude: insertLocation.longitude ?? null,
    };
    this.locations.set(location.id, location);
    return location;
  }

  // Work Days
  async getWorkDay(id: number): Promise<WorkDay | undefined> {
    return this.workDays.get(id);
  }

  async getActiveWorkDayByDriver(driverId: number): Promise<WorkDay | undefined> {
    return Array.from(this.workDays.values()).find(
      workDay => workDay.driverId === driverId && workDay.status === "active"
    );
  }

  async getActiveWorkDays(): Promise<WorkDay[]> {
    return Array.from(this.workDays.values()).filter(
      workDay => workDay.status === "active" || workDay.status === "completed"
    );
  }

  async getCompletedWorkDays(): Promise<Array<WorkDay & { driver: User; truck: Truck; job: Job; totalActivities: number }>> {
    const completedWorkDays = Array.from(this.workDays.values())
      .filter(wd => wd.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return completedWorkDays.map(workDay => {
      const driver = this.users.get(workDay.driverId);
      const truck = this.trucks.get(workDay.truckId);
      const job = this.jobs.get(workDay.jobId);
      const activities = Array.from(this.activities.values()).filter(a => a.workDayId === workDay.id);

      return {
        ...workDay,
        driver: driver!,
        truck: truck!,
        job: job!,
        totalActivities: activities.length,
      };
    }).filter(item => item.driver && item.truck && item.job);
  }

  async createWorkDay(insertWorkDay: InsertWorkDay): Promise<WorkDay> {
    const workDay: WorkDay = {
      ...insertWorkDay,
      id: this.currentWorkDayId++,
      totalLoads: 0,
      createdAt: new Date(),
      status: insertWorkDay.status ?? null,
      startTime: insertWorkDay.startTime ?? null,
      endTime: insertWorkDay.endTime ?? null,
      driverSignature: insertWorkDay.driverSignature ?? null,
      operatorSignature: insertWorkDay.operatorSignature ?? null,
      operatorName: insertWorkDay.operatorName ?? null,
    };
    this.workDays.set(workDay.id, workDay);
    return workDay;
  }

  async updateWorkDay(id: number, updates: Partial<WorkDay>): Promise<WorkDay | undefined> {
    const workDay = this.workDays.get(id);
    if (!workDay) return undefined;
    
    const updatedWorkDay = { ...workDay, ...updates };
    this.workDays.set(id, updatedWorkDay);
    return updatedWorkDay;
  }

  // Activities
  async getActivitiesByWorkDay(workDayId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.workDayId === workDayId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity: Activity = {
      ...insertActivity,
      id: this.currentActivityId++,
      createdAt: new Date(),
      latitude: insertActivity.latitude ?? null,
      longitude: insertActivity.longitude ?? null,
      ticketNumber: insertActivity.ticketNumber ?? null,
      netWeight: insertActivity.netWeight ?? null,
      notes: insertActivity.notes ?? null,
      cancelled: false,
      cancelledAt: null,
    };
    this.activities.set(activity.id, activity);
    return activity;
  }

  async updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) {
      return undefined;
    }

    const updatedActivity: Activity = {
      ...activity,
      ...updates,
    };
    
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async getRecentActivities(limit = 10): Promise<Array<Activity & { driver: User; truck: Truck; job: Job }>> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return activities.map(activity => {
      const workDay = this.workDays.get(activity.workDayId);
      const driver = workDay ? this.users.get(workDay.driverId) : undefined;
      const truck = workDay ? this.trucks.get(workDay.truckId) : undefined;
      const job = workDay ? this.jobs.get(workDay.jobId) : undefined;

      return {
        ...activity,
        driver: driver!,
        truck: truck!,
        job: job!,
      };
    }).filter(item => item.driver && item.truck && item.job);
  }

  // Dispatches
  async getDispatches(brokerId?: number): Promise<Dispatch[]> {
    const dispatches = Array.from(this.dispatches.values());
    return brokerId ? dispatches.filter(d => d.brokerId === brokerId) : dispatches;
  }

  async getDispatch(id: number): Promise<Dispatch | undefined> {
    return this.dispatches.get(id);
  }

  async createDispatch(insertDispatch: InsertDispatch): Promise<Dispatch> {
    const dispatch: Dispatch = {
      id: this.currentDispatchId++,
      ...insertDispatch,
      createdAt: new Date(),
    };
    this.dispatches.set(dispatch.id, dispatch);
    return dispatch;
  }

  async updateDispatch(id: number, updates: Partial<Dispatch>): Promise<Dispatch | undefined> {
    const dispatch = this.dispatches.get(id);
    if (!dispatch) return undefined;

    const updatedDispatch: Dispatch = { ...dispatch, ...updates };
    this.dispatches.set(id, updatedDispatch);
    return updatedDispatch;
  }

  async getDispatchesByCustomer(customerId: number): Promise<Dispatch[]> {
    return Array.from(this.dispatches.values()).filter(d => d.customerId === customerId);
  }

  // Dispatch Assignments
  async getDispatchAssignments(dispatchId?: number, driverId?: number): Promise<DispatchAssignment[]> {
    const assignments = Array.from(this.dispatchAssignments.values());
    let filtered = assignments;
    if (dispatchId) filtered = filtered.filter(a => a.dispatchId === dispatchId);
    if (driverId) filtered = filtered.filter(a => a.driverId === driverId);
    return filtered;
  }

  async createDispatchAssignment(insertAssignment: InsertDispatchAssignment): Promise<DispatchAssignment> {
    const assignment: DispatchAssignment = {
      id: this.currentDispatchAssignmentId++,
      ...insertAssignment,
      createdAt: new Date(),
    };
    this.dispatchAssignments.set(assignment.id, assignment);
    return assignment;
  }

  async updateDispatchAssignment(id: number, updates: Partial<DispatchAssignment>): Promise<DispatchAssignment | undefined> {
    const assignment = this.dispatchAssignments.get(id);
    if (!assignment) return undefined;

    const updatedAssignment: DispatchAssignment = { ...assignment, ...updates };
    this.dispatchAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async getDispatchAssignmentsByLeasor(leasorId: number): Promise<Array<DispatchAssignment & { dispatch: Dispatch; truck: Truck }>> {
    const assignments = Array.from(this.dispatchAssignments.values());
    const leasorTrucks = Array.from(this.trucks.values()).filter(t => t.companyId === leasorId);
    const leasorTruckIds = leasorTrucks.map(t => t.id);

    return assignments
      .filter(a => leasorTruckIds.includes(a.truckId))
      .map(assignment => {
        const dispatch = this.dispatches.get(assignment.dispatchId);
        const truck = this.trucks.get(assignment.truckId);
        return {
          ...assignment,
          dispatch: dispatch!,
          truck: truck!,
        };
      })
      .filter(item => item.dispatch && item.truck);
  }

  // Broker-Leasor Relationships
  async getBrokerLeasorRelationships(brokerId?: number, leasorId?: number): Promise<BrokerLeasorRelationship[]> {
    const relationships = Array.from(this.brokerLeasorRelationships.values());
    let filtered = relationships;
    if (brokerId) filtered = filtered.filter(r => r.brokerId === brokerId);
    if (leasorId) filtered = filtered.filter(r => r.leasorId === leasorId);
    return filtered;
  }

  async createBrokerLeasorRelationship(insertRelationship: InsertBrokerLeasorRelationship): Promise<BrokerLeasorRelationship> {
    const relationship: BrokerLeasorRelationship = {
      id: this.currentBrokerLeasorRelationshipId++,
      ...insertRelationship,
      createdAt: new Date(),
    };
    this.brokerLeasorRelationships.set(relationship.id, relationship);
    return relationship;
  }

  async updateBrokerLeasorRelationship(id: number, updates: Partial<BrokerLeasorRelationship>): Promise<BrokerLeasorRelationship | undefined> {
    const relationship = this.brokerLeasorRelationships.get(id);
    if (!relationship) return undefined;

    const updatedRelationship: BrokerLeasorRelationship = { ...relationship, ...updates };
    this.brokerLeasorRelationships.set(id, updatedRelationship);
    return updatedRelationship;
  }

  // Reusable Data
  async getReusableData(type: string, brokerId: number): Promise<ReusableData[]> {
    return Array.from(this.reusableData.values())
      .filter(d => d.type === type && d.brokerId === brokerId)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  async createReusableData(insertData: InsertReusableData): Promise<ReusableData> {
    const data: ReusableData = {
      id: this.currentReusableDataId++,
      usageCount: 1,
      ...insertData,
      createdAt: new Date(),
    };
    this.reusableData.set(data.id, data);
    return data;
  }

  async updateReusableDataUsage(id: number): Promise<void> {
    const data = this.reusableData.get(id);
    if (data) {
      data.usageCount++;
      this.reusableData.set(id, data);
    }
  }

  // Role-based access helpers
  async getCustomersByBroker(brokerId: number): Promise<Customer[]> {
    // In this implementation, customers are scoped to brokers via user relationships
    const brokerUsers = Array.from(this.users.values()).filter(u => u.brokerId === brokerId && u.role === 'customer');
    return Array.from(this.customers.values()).filter(c => 
      brokerUsers.some(u => u.companyId === c.id)
    );
  }

  async getTrucksByBroker(brokerId: number): Promise<Array<Truck & { company: Company }>> {
    // Get trucks from broker's own company and contracted leasors
    const relationships = await this.getBrokerLeasorRelationships(brokerId);
    const leasorIds = relationships.filter(r => r.isActive).map(r => r.leasorId);
    
    // Get broker's own company
    const brokerUser = Array.from(this.users.values()).find(u => u.id === brokerId && u.role === 'broker');
    const brokerCompanyId = brokerUser?.companyId;
    
    const companyIds = brokerCompanyId ? [brokerCompanyId, ...leasorIds] : leasorIds;
    
    return Array.from(this.trucks.values())
      .filter(t => companyIds.includes(t.companyId))
      .map(truck => {
        const company = this.companies.get(truck.companyId);
        return {
          ...truck,
          company: company!,
        };
      })
      .filter(item => item.company);
  }

  async getLeasorsByBroker(brokerId: number): Promise<Company[]> {
    const relationships = await this.getBrokerLeasorRelationships(brokerId);
    const leasorIds = relationships.filter(r => r.isActive).map(r => r.leasorId);
    
    return Array.from(this.companies.values())
      .filter(c => leasorIds.includes(c.id) && c.type === 'leasor');
  }

  // Employee management
  async getEmployeesByCompany(companyId: number): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(u => u.companyId === companyId && u.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createEmployee(insertEmployee: InsertUser): Promise<User> {
    const employee: User = {
      id: this.currentUserId++,
      ...insertEmployee,
      brokerId: insertEmployee.brokerId || null,
      permissions: insertEmployee.permissions || "basic",
      isActive: insertEmployee.isActive !== false,
      createdAt: new Date(),
    };
    this.users.set(employee.id, employee);
    return employee;
  }

  async updateEmployee(id: number, updates: Partial<User>): Promise<User | undefined> {
    const employee = this.users.get(id);
    if (!employee) return undefined;

    const updatedEmployee: User = { ...employee, ...updates };
    this.users.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deactivateEmployee(id: number): Promise<User | undefined> {
    const employee = this.users.get(id);
    if (!employee) return undefined;

    const updatedEmployee: User = { ...employee, isActive: false };
    this.users.set(id, updatedEmployee);
    return updatedEmployee;
  }

  // Company management
  async getCompaniesByType(type: string): Promise<Company[]> {
    return Array.from(this.companies.values())
      .filter(c => c.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCompanyById(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  // Lease Hauler Portal method implementations
  async getUsersByCompany(companyId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.companyId === companyId);
  }

  async getDispatchesByCompany(companyId: number): Promise<Dispatch[]> {
    return Array.from(this.dispatches.values()).filter(dispatch => dispatch.brokerId === companyId);
  }

  async getActivitiesByCompany(companyId: number, date: Date): Promise<Activity[]> {
    const companyTrucks = Array.from(this.trucks.values()).filter(truck => truck.companyId === companyId);
    const truckIds = companyTrucks.map(t => t.id);
    const companyWorkDays = Array.from(this.workDays.values()).filter(wd => truckIds.includes(wd.truckId));
    const workDayIds = companyWorkDays.map(wd => wd.id);
    return Array.from(this.activities.values()).filter(activity => workDayIds.includes(activity.workDayId));
  }

  async updateTruck(id: number, updates: Partial<Truck>): Promise<Truck | undefined> {
    if (this.trucks.has(id)) {
      const existing = this.trucks.get(id)!;
      const updated = { ...existing, ...updates };
      this.trucks.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteTruck(id: number): Promise<void> {
    this.trucks.delete(id);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    if (this.users.has(id)) {
      const existing = this.users.get(id)!;
      const updated = { ...existing, ...updates };
      this.users.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async createUserInvitation(invitation: {
    email: string;
    name: string;
    role: string;
    companyId: number;
    invitedBy: number;
  }): Promise<any> {
    const id = Date.now();
    const inv = {
      id,
      ...invitation,
      createdAt: new Date(),
      status: 'pending'
    };
    this.userInvitations.set(id, inv);
    return inv;
  }

  async getPendingInvitationsByCompany(companyId: number): Promise<any[]> {
    return Array.from(this.userInvitations.values()).filter(inv => inv.companyId === companyId && inv.status === 'pending');
  }
}

// Initialize demo data in database on first run
async function initializeDemoData() {
  // Check if demo data already exists
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    return; // Data already initialized
  }

  // Create demo companies
  const brokerCompany = await db.insert(companies).values({
    name: "Terra Firma Brokers",
    type: "broker",
    contactEmail: "info@terrafirma.com",
    contactPhone: "(555) 123-4567",
    address: "123 Broker St, Salt Lake City, UT 84101"
  }).returning();

  const leasorCompany = await db.insert(companies).values({
    name: "Mountain Trucking LLC",
    type: "leasor",
    contactEmail: "dispatch@mountaintrucking.com",
    contactPhone: "(555) 987-6543",
    address: "456 Truck Ave, Provo, UT 84601"
  }).returning();

  const customerCompany = await db.insert(companies).values({
    name: "Wasatch Construction",
    type: "customer",
    contactEmail: "jobs@wasatchconstruction.com",
    contactPhone: "(555) 555-0123",
    address: "789 Construction Blvd, West Valley City, UT 84119"
  }).returning();

  // Create demo users
  await db.insert(users).values({
    email: "sarah.broker@terrafirma.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyaVz4xVJO6m/K", // broker123
    name: "Sarah Johnson",
    role: "broker",
    companyId: brokerCompany[0].id,
    brokerId: null,
    permissions: "admin",
    isActive: true
  });

  await db.insert(users).values({
    email: "mike.johnson@mountaintrucking.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyaVz4xVJO6m/K", // driver123
    name: "Mike Johnson",
    role: "driver",
    companyId: leasorCompany[0].id,
    brokerId: brokerCompany[0].id,
    permissions: "basic",
    isActive: true
  });

  // Create demo leasor admin user
  await db.insert(users).values({
    email: "admin@mountaintrucking.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyaVz4xVJO6m/K", // leasor123
    name: "Mountain Trucking Admin",
    role: "leasor_admin",
    companyId: leasorCompany[0].id,
    brokerId: null,
    permissions: "admin",
    isActive: true
  });

  // Create demo trucks for the leasor company
  await db.insert(trucks).values([
    {
      number: "MT-001",
      type: "Side Dump",
      companyId: leasorCompany[0].id,
      isActive: true
    },
    {
      number: "MT-002", 
      type: "End Dump",
      companyId: leasorCompany[0].id,
      isActive: true
    },
    {
      number: "MT-003",
      type: "Tri-Axle",
      companyId: leasorCompany[0].id,
      isActive: false
    }
  ]);

  // Create broker-leasor relationship
  await db.insert(brokerLeasorRelationships).values({
    brokerId: brokerCompany[0].id,
    leasorId: leasorCompany[0].id,
    isActive: true
  });

  // Create demo customer
  const customer = await db.insert(customers).values({
    name: "Wasatch Construction",
    contactEmail: "jobs@wasatchconstruction.com",
    contactPhone: "(555) 555-0123",
    address: "789 Construction Blvd, West Valley City, UT 84119"
  }).returning();

  // Create demo truck
  await db.insert(trucks).values({
    number: "T-001",
    type: "Tri-Axle",
    companyId: leasorCompany[0].id
  });

  // Create demo job
  await db.insert(jobs).values({
    name: "Wasatch Highway Expansion",
    description: "Road construction and material delivery",
    customerId: customer[0].id
  });

  // Create demo materials
  await db.insert(materials).values({
    name: "Road Base",
    type: "A1A",
    pricePerLoad: "150.00"
  });

  // Create demo locations
  await db.insert(locations).values({
    name: "Smith Quarry",
    address: "1234 Quarry Rd, Salt Lake City, UT",
    type: "source",
    latitude: "40.7608",
    longitude: "-111.8910"
  });

  await db.insert(locations).values({
    name: "Highway Construction Site",
    address: "5678 Highway 15, Provo, UT",
    type: "destination",
    latitude: "40.2338",
    longitude: "-111.6585"
  });

  console.log("Demo data initialized successfully");
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  // Trucks
  async getTrucks(): Promise<Truck[]> {
    return await db.select().from(trucks);
  }

  async getTrucksByCompany(companyId: number): Promise<Truck[]> {
    return await db.select().from(trucks).where(eq(trucks.companyId, companyId));
  }

  async createTruck(insertTruck: InsertTruck): Promise<Truck> {
    const [truck] = await db.insert(trucks).values(insertTruck).returning();
    return truck;
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getActiveJobs(): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.status, "active"));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(insertMaterial).returning();
    return material;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getLocationsByType(type: string): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.type, type));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).returning();
    return location;
  }

  // Work Days
  async getWorkDay(id: number): Promise<WorkDay | undefined> {
    const [workDay] = await db.select().from(workDays).where(eq(workDays.id, id));
    return workDay;
  }

  async getActiveWorkDayByDriver(driverId: number): Promise<WorkDay | undefined> {
    const [workDay] = await db.select().from(workDays)
      .where(and(eq(workDays.driverId, driverId), eq(workDays.status, "active")));
    return workDay;
  }

  async getActiveWorkDays(): Promise<WorkDay[]> {
    return await db.select().from(workDays).where(eq(workDays.status, "active"));
  }

  async getCompletedWorkDays(): Promise<Array<WorkDay & { driver: User; truck: Truck; job: Job; totalActivities: number }>> {
    console.log("=== STORAGE: getCompletedWorkDays called ===");
    
    // First, let's see all work days to understand what we have
    const allWorkDays = await db.select().from(workDays);
    console.log("All work days in database:", allWorkDays.map(wd => ({ 
      id: wd.id, 
      status: wd.status, 
      driverId: wd.driverId,
      endTime: wd.endTime 
    })));
    
    console.log("Querying for completed work days...");
    const completedWorkDaysWithDetails = await db
      .select({
        workDay: workDays,
        driver: users,
        truck: trucks,
        job: jobs,
      })
      .from(workDays)
      .leftJoin(users, eq(workDays.driverId, users.id))
      .leftJoin(trucks, eq(workDays.truckId, trucks.id))
      .leftJoin(jobs, eq(workDays.jobId, jobs.id))
      .where(eq(workDays.status, "completed"))
      .orderBy(desc(workDays.createdAt));

    console.log("Raw completed work days query result:", completedWorkDaysWithDetails.length, "rows");
    console.log("Work days with details:", completedWorkDaysWithDetails.map(row => ({
      workDayId: row.workDay?.id,
      status: row.workDay?.status,
      driverName: row.driver?.name,
      truckNumber: row.truck?.number,
      jobName: row.job?.name
    })));

    const result = [];
    for (const row of completedWorkDaysWithDetails) {
      if (row.workDay && row.driver && row.truck && row.job) {
        const activityCount = await db
          .select({ count: count(activities.id) })
          .from(activities)
          .where(eq(activities.workDayId, row.workDay.id));

        result.push({
          ...row.workDay,
          driver: row.driver,
          truck: row.truck,
          job: row.job,
          totalActivities: activityCount[0]?.count || 0,
        });
      }
    }

    console.log("Final completed work days result:", result.length, "items");
    console.log("=== STORAGE: getCompletedWorkDays complete ===");
    return result;
  }

  async createWorkDay(insertWorkDay: InsertWorkDay): Promise<WorkDay> {
    const [workDay] = await db.insert(workDays).values(insertWorkDay).returning();
    return workDay;
  }

  async updateWorkDay(id: number, updates: Partial<WorkDay>): Promise<WorkDay | undefined> {
    console.log("=== STORAGE: updateWorkDay called ===");
    console.log("Work day ID:", id);
    console.log("Updates to apply:", JSON.stringify(updates, null, 2));
    
    // First, get the current work day to see what we're updating
    const currentWorkDay = await db.select().from(workDays).where(eq(workDays.id, id));
    console.log("Current work day before update:", currentWorkDay.length > 0 ? JSON.stringify(currentWorkDay[0], null, 2) : "NOT FOUND");
    
    if (currentWorkDay.length === 0) {
      console.log("Work day not found - returning undefined");
      return undefined;
    }
    
    // Process updates to handle date conversion and ensure proper types
    const processedUpdates: any = { ...updates };
    
    // Convert endTime if it's a string to a proper Date object
    if (processedUpdates.endTime) {
      if (typeof processedUpdates.endTime === 'string') {
        processedUpdates.endTime = new Date(processedUpdates.endTime);
      }
      console.log("Processed endTime:", processedUpdates.endTime);
    }
    
    // Ensure totalLoads is a number
    if (processedUpdates.totalLoads !== undefined) {
      processedUpdates.totalLoads = Number(processedUpdates.totalLoads);
      console.log("Processed totalLoads:", processedUpdates.totalLoads);
    }
    
    console.log("Processed updates:", JSON.stringify(processedUpdates, null, 2));
    console.log("Executing database update...");
    
    try {
      const [workDay] = await db.update(workDays)
        .set(processedUpdates)
        .where(eq(workDays.id, id))
        .returning();
      
      console.log("Database update complete!");
      console.log("Updated work day:", workDay ? JSON.stringify(workDay, null, 2) : "NO RESULT");
      console.log("=== STORAGE: updateWorkDay complete ===");
      
      return workDay;
    } catch (dbError) {
      console.error("Database update error:", dbError);
      throw new Error(`Database update failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }
  }

  // Activities
  async getActivitiesByWorkDay(workDayId: number): Promise<Activity[]> {
    return await db.select().from(activities)
      .where(eq(activities.workDayId, workDayId))
      .orderBy(asc(activities.createdAt));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  async updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined> {
    const [activity] = await db.update(activities)
      .set(updates)
      .where(eq(activities.id, id))
      .returning();
    return activity;
  }

  async getRecentActivities(limit = 10): Promise<Array<Activity & { driver: User; truck: Truck; job: Job }>> {
    const result = await db.select({
      id: activities.id,
      workDayId: activities.workDayId,
      loadNumber: activities.loadNumber,
      activityType: activities.activityType,
      timestamp: activities.timestamp,
      latitude: activities.latitude,
      longitude: activities.longitude,
      notes: activities.notes,
      ticketNumber: activities.ticketNumber,
      netWeight: activities.netWeight,
      cancelled: activities.cancelled,
      cancelledAt: activities.cancelledAt,
      createdAt: activities.createdAt,
      driver: users,
      truck: trucks,
      job: jobs
    })
    .from(activities)
    .innerJoin(workDays, eq(activities.workDayId, workDays.id))
    .innerJoin(users, eq(workDays.driverId, users.id))
    .innerJoin(trucks, eq(workDays.truckId, trucks.id))
    .innerJoin(jobs, eq(workDays.jobId, jobs.id))
    .orderBy(desc(activities.createdAt))
    .limit(limit);

    return result.map(row => ({
      id: row.id,
      workDayId: row.workDayId,
      loadNumber: row.loadNumber,
      activityType: row.activityType,
      timestamp: row.timestamp,
      latitude: row.latitude,
      longitude: row.longitude,
      notes: row.notes,
      ticketNumber: row.ticketNumber,
      netWeight: row.netWeight,
      cancelled: row.cancelled,
      cancelledAt: row.cancelledAt,
      createdAt: row.createdAt,
      driver: row.driver,
      truck: row.truck,
      job: row.job
    }));
  }

  // Dispatches
  async getDispatches(brokerId?: number): Promise<Dispatch[]> {
    if (brokerId) {
      return await db.select().from(dispatches)
        .where(eq(dispatches.brokerId, brokerId))
        .orderBy(desc(dispatches.createdAt));
    }
    return await db.select().from(dispatches).orderBy(desc(dispatches.createdAt));
  }

  async getDispatch(id: number): Promise<Dispatch | undefined> {
    const [dispatch] = await db.select().from(dispatches).where(eq(dispatches.id, id));
    return dispatch;
  }

  async createDispatch(insertDispatch: InsertDispatch): Promise<Dispatch> {
    const [dispatch] = await db.insert(dispatches).values(insertDispatch).returning();
    return dispatch;
  }

  async updateDispatch(id: number, updates: Partial<Dispatch>): Promise<Dispatch | undefined> {
    const [dispatch] = await db.update(dispatches)
      .set(updates)
      .where(eq(dispatches.id, id))
      .returning();
    return dispatch;
  }

  async getDispatchesByCustomer(customerId: number): Promise<Dispatch[]> {
    return await db.select().from(dispatches)
      .where(eq(dispatches.customerId, customerId))
      .orderBy(desc(dispatches.createdAt));
  }

  // Dispatch Assignments
  async getDispatchAssignments(dispatchId?: number, driverId?: number): Promise<DispatchAssignment[]> {
    let query = db.select().from(dispatchAssignments);
    
    if (dispatchId && driverId) {
      query = query.where(and(eq(dispatchAssignments.dispatchId, dispatchId), eq(dispatchAssignments.driverId, driverId)));
    } else if (dispatchId) {
      query = query.where(eq(dispatchAssignments.dispatchId, dispatchId));
    } else if (driverId) {
      query = query.where(eq(dispatchAssignments.driverId, driverId));
    }
    
    return await query;
  }

  async createDispatchAssignment(insertAssignment: InsertDispatchAssignment): Promise<DispatchAssignment> {
    const [assignment] = await db.insert(dispatchAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async updateDispatchAssignment(id: number, updates: Partial<DispatchAssignment>): Promise<DispatchAssignment | undefined> {
    const [assignment] = await db.update(dispatchAssignments)
      .set(updates)
      .where(eq(dispatchAssignments.id, id))
      .returning();
    return assignment;
  }

  async getDispatchAssignmentsByLeasor(leasorId: number): Promise<Array<DispatchAssignment & { dispatch: Dispatch; truck: Truck }>> {
    const result = await db.select({
      id: dispatchAssignments.id,
      dispatchId: dispatchAssignments.dispatchId,
      truckId: dispatchAssignments.truckId,
      driverId: dispatchAssignments.driverId,
      assignedBy: dispatchAssignments.assignedBy,
      status: dispatchAssignments.status,
      createdAt: dispatchAssignments.createdAt,
      dispatch: dispatches,
      truck: trucks
    })
    .from(dispatchAssignments)
    .innerJoin(dispatches, eq(dispatchAssignments.dispatchId, dispatches.id))
    .innerJoin(trucks, eq(dispatchAssignments.truckId, trucks.id))
    .where(eq(trucks.companyId, leasorId));

    return result.map(row => ({
      id: row.id,
      dispatchId: row.dispatchId,
      truckId: row.truckId,
      driverId: row.driverId,
      assignedBy: row.assignedBy,
      status: row.status,
      createdAt: row.createdAt,
      dispatch: row.dispatch,
      truck: row.truck
    }));
  }

  // Broker-Leasor Relationships
  async getBrokerLeasorRelationships(brokerId?: number, leasorId?: number): Promise<BrokerLeasorRelationship[]> {
    let query = db.select().from(brokerLeasorRelationships);
    
    if (brokerId && leasorId) {
      query = query.where(and(eq(brokerLeasorRelationships.brokerId, brokerId), eq(brokerLeasorRelationships.leasorId, leasorId)));
    } else if (brokerId) {
      query = query.where(eq(brokerLeasorRelationships.brokerId, brokerId));
    } else if (leasorId) {
      query = query.where(eq(brokerLeasorRelationships.leasorId, leasorId));
    }
    
    return await query;
  }

  async createBrokerLeasorRelationship(insertRelationship: InsertBrokerLeasorRelationship): Promise<BrokerLeasorRelationship> {
    const [relationship] = await db.insert(brokerLeasorRelationships).values(insertRelationship).returning();
    return relationship;
  }

  async updateBrokerLeasorRelationship(id: number, updates: Partial<BrokerLeasorRelationship>): Promise<BrokerLeasorRelationship | undefined> {
    const [relationship] = await db.update(brokerLeasorRelationships)
      .set(updates)
      .where(eq(brokerLeasorRelationships.id, id))
      .returning();
    return relationship;
  }

  // Reusable Data
  async getReusableData(type: string, brokerId: number): Promise<ReusableData[]> {
    return await db.select().from(reusableData)
      .where(and(eq(reusableData.type, type), eq(reusableData.brokerId, brokerId)))
      .orderBy(desc(reusableData.usageCount));
  }

  async createReusableData(insertData: InsertReusableData): Promise<ReusableData> {
    const [data] = await db.insert(reusableData).values(insertData).returning();
    return data;
  }

  async updateReusableDataUsage(id: number): Promise<void> {
    await db.update(reusableData)
      .set({ usageCount: 1 })
      .where(eq(reusableData.id, id));
  }

  // Role-based access helpers
  async getCustomersByBroker(brokerId: number): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getTrucksByBroker(brokerId: number): Promise<Array<Truck & { company: Company }>> {
    const result = await db.select({
      id: trucks.id,
      number: trucks.number,
      type: trucks.type,
      companyId: trucks.companyId,
      isActive: trucks.isActive,
      createdAt: trucks.createdAt,
      company: companies
    })
    .from(trucks)
    .innerJoin(companies, eq(trucks.companyId, companies.id));

    return result.map(row => ({
      id: row.id,
      number: row.number,
      type: row.type,
      companyId: row.companyId,
      isActive: row.isActive,
      createdAt: row.createdAt,
      company: row.company
    }));
  }

  async getLeasorsByBroker(brokerId: number): Promise<Company[]> {
    const result = await db.select({
      company: companies
    })
    .from(brokerLeasorRelationships)
    .innerJoin(companies, eq(brokerLeasorRelationships.leasorId, companies.id))
    .where(eq(brokerLeasorRelationships.brokerId, brokerId));

    return result.map(row => row.company);
  }

  // Employee management
  async getEmployeesByCompany(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  async createEmployee(insertEmployee: InsertUser): Promise<User> {
    const [employee] = await db.insert(users).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [employee] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return employee;
  }

  async deactivateEmployee(id: number): Promise<User | undefined> {
    const [employee] = await db.update(users)
      .set({ isActive: false })
      .where(eq(users.id, id))
      .returning();
    return employee;
  }

  // Company management
  async getCompaniesByType(type: string): Promise<Company[]> {
    return await db.select().from(companies)
      .where(eq(companies.type, type))
      .orderBy(asc(companies.name));
  }

  async getCompanyById(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  // Lease Hauler Portal methods
  async getUsersByCompany(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  async getDispatchesByCompany(companyId: number): Promise<Dispatch[]> {
    return await db.select().from(dispatches)
      .where(eq(dispatches.brokerId, companyId))
      .orderBy(desc(dispatches.createdAt));
  }

  async getActivitiesByCompany(companyId: number, date: Date): Promise<Activity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get activities for trucks belonging to the company
    const companyTrucks = await db.select().from(trucks).where(eq(trucks.companyId, companyId));
    const truckIds = companyTrucks.map(t => t.id);

    if (truckIds.length === 0) return [];

    return await db.select().from(activities)
      .innerJoin(workDays, eq(activities.workDayId, workDays.id))
      .where(
        and(
          eq(workDays.truckId, truckIds[0]), // Simplified - would need proper IN clause
          eq(activities.timestamp, startOfDay)
        )
      );
  }

  async updateTruck(id: number, updates: Partial<Truck>): Promise<Truck | undefined> {
    const [truck] = await db.update(trucks)
      .set(updates)
      .where(eq(trucks.id, id))
      .returning();
    return truck;
  }

  async deleteTruck(id: number): Promise<void> {
    await db.delete(trucks).where(eq(trucks.id, id));
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUserInvitation(invitation: {
    email: string;
    name: string;
    role: string;
    companyId: number;
    invitedBy: number;
  }): Promise<any> {
    // Simplified invitation system - in production, would use a proper invitations table
    return {
      id: Date.now(),
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      companyId: invitation.companyId,
      invitedBy: invitation.invitedBy,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending'
    };
  }

  async getPendingInvitationsByCompany(companyId: number): Promise<any[]> {
    // Simplified - would query from invitations table in production
    return [];
  }
}

// Initialize database storage and demo data
let storageInstance: DatabaseStorage | null = null;

const initializeStorage = async () => {
  if (!storageInstance) {
    await initializeDemoData();
    storageInstance = new DatabaseStorage();
  }
  return storageInstance;
};

export const getStorage = initializeStorage;

// For backward compatibility, initialize storage immediately
export const storage = new DatabaseStorage();
