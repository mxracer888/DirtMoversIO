import { 
  users, trucks, jobs, customers, materials, locations, workDays, activities, companies,
  type User, type InsertUser, type Truck, type InsertTruck, type Job, type InsertJob,
  type Customer, type InsertCustomer, type Material, type InsertMaterial, 
  type Location, type InsertLocation, type WorkDay, type InsertWorkDay,
  type Activity, type InsertActivity, type Company, type InsertCompany
} from "@shared/schema";

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
  createWorkDay(workDay: InsertWorkDay): Promise<WorkDay>;
  updateWorkDay(id: number, updates: Partial<WorkDay>): Promise<WorkDay | undefined>;
  
  // Activities
  getActivitiesByWorkDay(workDayId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined>;
  getRecentActivities(limit?: number): Promise<Array<Activity & { driver: User; truck: Truck; job: Job }>>;
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
  
  private currentUserId = 1;
  private currentCompanyId = 1;
  private currentTruckId = 1;
  private currentJobId = 1;
  private currentCustomerId = 1;
  private currentMaterialId = 1;
  private currentLocationId = 1;
  private currentWorkDayId = 1;
  private currentActivityId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create sample company
    const company: Company = {
      id: this.currentCompanyId++,
      name: "TerraFirma Logistics",
      contactEmail: "info@terrafirma.com",
      contactPhone: "(555) 123-4567",
      address: "123 Industrial Blvd, Salt Lake City, UT 84101",
      createdAt: new Date(),
    };
    this.companies.set(company.id, company);

    // Create sample users
    const users: User[] = [
      {
        id: this.currentUserId++,
        email: "mike.johnson@company.com",
        password: "password123",
        name: "Mike Johnson",
        role: "driver",
        companyId: company.id,
        createdAt: new Date(),
      },
      {
        id: this.currentUserId++,
        email: "sarah.broker@company.com",
        password: "broker123",
        name: "Sarah Wilson",
        role: "broker",
        companyId: company.id,
        createdAt: new Date(),
      },
    ];
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
}

export const storage = new MemStorage();
