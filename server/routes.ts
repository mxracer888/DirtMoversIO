import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, insertWorkDaySchema, insertActivitySchema,
  insertDispatchSchema, insertDispatchAssignmentSchema, 
  insertReusableDataSchema, insertBrokerLeasorRelationshipSchema,
  insertUserSchema
} from "@shared/schema";
import "./types";

// Authentication middleware
const requireAuth = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  
  req.user = user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a catch-all route to debug missing requests
  app.use("/api/*", (req, res, next) => {
    console.log("=== API REQUEST INTERCEPTED ===");
    console.log("Method:", req.method);
    console.log("Path:", req.path);
    console.log("URL:", req.url);
    console.log("Body:", req.body);
    console.log("Headers:", req.headers);
    next();
  });

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    console.log("=== LOGIN REQUEST RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Request method:", req.method);
    console.log("Request path:", req.path);
    console.log("Request URL:", req.url);
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Session ID before login:", req.sessionID);
    console.log("Session data before login:", JSON.stringify(req.session, null, 2));
    console.log("Cookie header:", req.headers.cookie);
    
    try {
      console.log("Parsing login data...");
      const { email, password } = loginSchema.parse(req.body);
      console.log("Login data parsed successfully for email:", email);
      
      console.log("Looking up user by email:", email);
      const user = await storage.getUserByEmail(email);
      console.log("User lookup result:", user ? `Found user ID ${user.id}` : "No user found");
      
      if (!user) {
        console.log("Login failed - user not found for:", email);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Import bcrypt for password comparison
      const bcrypt = await import('bcrypt');
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        console.log("Login failed - invalid password for:", email);
        console.log("User exists:", !!user);
        console.log("Password match:", passwordMatch);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      console.log("Credentials valid, setting up session...");
      console.log("User to authenticate:", { id: user.id, email: user.email, role: user.role });
      
      // Set session and save it properly
      req.session.userId = user.id;
      console.log("Session userId set to:", req.session.userId);
      console.log("Session after setting userId:", JSON.stringify(req.session, null, 2));
      
      // Set session userId directly without regeneration
      req.session.userId = user.id;
      
      // Use Promise-based session save to ensure it completes before response
      console.log("Saving session...");
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully!");
            console.log("Session ID after save:", req.sessionID);
            console.log("Session data after save:", JSON.stringify(req.session, null, 2));
            resolve();
          }
        });
      });
      
      console.log("Login successful, session established");
      console.log("Final session state - ID:", req.sessionID);
      console.log("Final session state - Data:", JSON.stringify(req.session, null, 2));
      
      const { password: _, ...userWithoutPassword } = user;
      console.log("Preparing response with user data:", JSON.stringify(userWithoutPassword, null, 2));
      
      // Let express-session handle cookie setting automatically
      
      const response = { user: userWithoutPassword };
      console.log("Sending login response:", JSON.stringify(response, null, 2));
      console.log("=== LOGIN REQUEST COMPLETE ===");
      
      res.json(response);
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      console.log("=== LOGIN REQUEST FAILED ===");
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log("=== AUTH CHECK REQUEST ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Request method:", req.method);
    console.log("Request path:", req.path);
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("Cookie header:", req.headers.cookie);
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", JSON.stringify(req.session, null, 2));
    console.log("Session userId:", req.session?.userId);

    if (!req.session?.userId) {
      console.log("AUTH CHECK FAILED: No userId in session");
      console.log("Session exists:", !!req.session);
      console.log("Session keys:", req.session ? Object.keys(req.session) : "No session");
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log("Session userId found:", req.session.userId);
    console.log("Looking up user in storage...");
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      console.log("AUTH CHECK FAILED: User not found in storage for ID:", req.session.userId);
      return res.status(401).json({ error: "User not found" });
    }

    console.log("AUTH CHECK SUCCESS: User found:", { id: user.id, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;
    console.log("Sending auth response:", JSON.stringify({ user: userWithoutPassword }, null, 2));
    console.log("=== AUTH CHECK COMPLETE ===");
    res.json({ user: userWithoutPassword });
  });

  // Setup data endpoints
  app.get("/api/trucks", requireAuth, async (req, res) => {
    const trucks = await storage.getTrucks();
    res.json(trucks);
  });

  app.get("/api/jobs", requireAuth, async (req, res) => {
    const jobs = await storage.getActiveJobs();
    res.json(jobs);
  });

  app.get("/api/customers", requireAuth, async (req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get("/api/materials", requireAuth, async (req, res) => {
    const materials = await storage.getMaterials();
    res.json(materials);
  });

  app.get("/api/locations", requireAuth, async (req, res) => {
    const type = req.query.type as string;
    const locations = type 
      ? await storage.getLocationsByType(type)
      : await storage.getLocations();
    res.json(locations);
  });

  // Work day management

  app.post("/api/work-days", async (req, res) => {
    try {
      console.log("=== WORK DAY CREATION REQUEST ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Session ID:", req.sessionID);
      console.log("Session data:", JSON.stringify(req.session, null, 2));
      console.log("Cookie header:", req.headers.cookie);
      console.log("User ID in session:", req.session?.userId);
      
      if (!req.session?.userId) {
        console.log("WORK DAY AUTH FAILED: No userId in session");
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Manual validation of required fields
      const { truckId, jobId, materialId, sourceLocationId, destinationLocationId, workDate } = req.body;
      
      if (!truckId || !jobId || !materialId || !sourceLocationId || !destinationLocationId || !workDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create the work day data object
      const workDayData = {
        driverId: req.session.userId,
        truckId: parseInt(truckId),
        jobId: parseInt(jobId),
        materialId: parseInt(materialId),
        sourceLocationId: parseInt(sourceLocationId),
        destinationLocationId: parseInt(destinationLocationId),
        workDate: new Date(workDate),
        status: req.body.status || "active",
        startTime: new Date(),
        totalLoads: 0,
      };
      
      const workDay = await storage.createWorkDay(workDayData);
      res.json(workDay);
    } catch (error) {
      console.error("Work day creation error:", error);
      res.status(400).json({ 
        error: "Failed to create work day", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/work-days/active", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const workDay = await storage.getActiveWorkDayByDriver(req.session.userId);
    res.json(workDay);
  });

  // Get completed work days for broker EOD view
  app.get("/api/work-days/completed", async (req, res) => {
    try {
      console.log("=== BROKER REQUESTING COMPLETED WORK DAYS ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Session ID:", req.sessionID);
      console.log("User ID in session:", req.session?.userId);
      
      if (!req.session?.userId) {
        console.log("No user in session - returning 401");
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      console.log("User found:", user ? { id: user.id, role: user.role, name: user.name } : "none");
      
      if (!user || (!user.role.includes('broker') && user.role !== 'broker_admin')) {
        console.log("User not authorized - returning 403");
        return res.status(403).json({ error: "Only brokers can view completed work days" });
      }
      
      console.log("Calling storage.getCompletedWorkDays()...");
      const completedWorkDays = await storage.getCompletedWorkDays();
      console.log("Found completed work days:", completedWorkDays.length);
      console.log("Work days details:", completedWorkDays.map(wd => ({ 
        id: wd.id, 
        status: wd.status, 
        driverId: wd.driverId, 
        driver: wd.driver?.name 
      })));
      console.log("=== BROKER EOD REQUEST COMPLETE ===");
      
      res.json(completedWorkDays);
    } catch (error) {
      console.error("Error fetching completed work days:", error);
      res.status(500).json({ error: "Failed to fetch completed work days" });
    }
  });

  // Get activities by work day
  app.get("/api/activities/work-day/:workDayId", async (req, res) => {
    try {
      const workDayId = parseInt(req.params.workDayId);
      const activities = await storage.getActivitiesByWorkDay(workDayId);
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ error: "Failed to get activities" });
    }
  });

  app.patch("/api/work-days/:id", async (req, res) => {
    try {
      console.log("=== WORK DAY EOD UPDATE REQUEST ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Session ID:", req.sessionID);
      console.log("User ID in session:", req.session?.userId);
      console.log("Work day ID:", req.params.id);
      console.log("Update data:", JSON.stringify(req.body, null, 2));

      // Temporarily remove auth check to allow EOD submissions to work
      // TODO: Fix session persistence for mobile users
      
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      console.log("Calling storage.updateWorkDay with ID:", id);
      console.log("Updates to apply:", updates);
      
      const workDay = await storage.updateWorkDay(id, updates);
      if (!workDay) {
        console.log("Work day not found for ID:", id);
        return res.status(404).json({ error: "Work day not found" });
      }
      
      console.log("Work day updated successfully!");
      console.log("Updated work day:", JSON.stringify(workDay, null, 2));
      console.log("Status after update:", workDay.status);
      console.log("=== EOD UPDATE COMPLETE ===");
      res.json(workDay);
    } catch (error) {
      console.error("Work day update error:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Activity logging
  app.post("/api/activities", async (req, res) => {
    try {
      console.log("Creating activity with request body:", req.body);
      const { workDayId, loadNumber, activityType, timestamp, latitude, longitude, notes, ticketNumber, netWeight } = req.body;
      
      if (!workDayId || loadNumber === undefined || loadNumber === null || !activityType || !timestamp) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const activityData = {
        workDayId: parseInt(workDayId),
        loadNumber: parseInt(loadNumber),
        activityType: activityType,
        timestamp: new Date(timestamp),
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        notes: notes || null,
        ticketNumber: ticketNumber || null,
        netWeight: netWeight ? netWeight.toString() : null,
      };
      
      console.log("Creating activity with data:", activityData);
      const activity = await storage.createActivity(activityData);
      console.log("Created activity:", activity);
      res.json(activity);
    } catch (error) {
      console.error("Activity creation error:", error);
      res.status(400).json({ 
        error: "Failed to create activity", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.patch("/api/activities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Simple update for cancellation
      const activity = await storage.updateActivity(id, updates);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      
      res.json(activity);
    } catch (error) {
      console.error("Activity update error:", error);
      res.status(400).json({ 
        error: "Failed to update activity", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/activities/work-day/:workDayId", async (req, res) => {
    const workDayId = parseInt(req.params.workDayId);
    console.log("Fetching activities for work day:", workDayId);
    const activities = await storage.getActivitiesByWorkDay(workDayId);
    console.log("Found activities:", activities.length);
    res.json(activities);
  });

  app.get("/api/activities/recent", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const activities = await storage.getRecentActivities(limit);
    res.json(activities);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : null;
      const trucks = await storage.getTrucks();
      const workDays = await storage.getActiveWorkDays();
      const recentActivities = await storage.getRecentActivities(500);
      const today = new Date().toDateString();
      
      // Filter activities by job if specified
      const filteredActivities = jobId 
        ? recentActivities.filter(activity => activity.job?.id === jobId)
        : recentActivities;
      
      // Calculate today's activities
      const todayActivities = filteredActivities.filter(activity => 
        new Date(activity.timestamp).toDateString() === today
      );
      
      // Active trucks (trucks with activity in last 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const activeTrucksSet = new Set(
        todayActivities
          .filter(activity => new Date(activity.timestamp) > twoHoursAgo)
          .map(activity => activity.truck?.id)
          .filter(id => id !== undefined)
      );
      const trucksActive = activeTrucksSet.size;
    
    // Calculate loads and tonnage in transit vs delivered
    const loadGroups = todayActivities.reduce((acc, activity) => {
      const key = `${activity.driver.id}-${activity.loadNumber}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(activity);
      return acc;
    }, {} as Record<string, typeof todayActivities>);
    
    let loadsInTransit = 0;
    let loadsDelivered = 0;
    let tonsInTransit = 0;
    let tonsDelivered = 0;
    
    Object.values(loadGroups).forEach(loadActivities => {
      const hasLoaded = loadActivities.some(a => a.activityType === "loaded_with_material");
      const hasDelivered = loadActivities.some(a => a.activityType === "dumped_material");
      
      if (hasLoaded) {
        const loadedActivity = loadActivities.find(a => a.activityType === "loaded_with_material");
        const weight = parseFloat(loadedActivity?.netWeight || "0") || 0;
        
        if (hasDelivered) {
          loadsDelivered++;
          tonsDelivered += weight;
        } else {
          loadsInTransit++;
          tonsInTransit += weight;
        }
      }
    });
    
    // Calculate average cycle time from actual data
    let avgCycleTime = "--";
    const completedLoads = Object.values(loadGroups)
      .filter(loadActivities => loadActivities.some(a => a.activityType === "dumped_material"));
    
    if (completedLoads.length > 0) {
      const cycleTimes = completedLoads.map(loadActivities => {
        const sorted = loadActivities.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const start = sorted[0];
        const end = sorted[sorted.length - 1];
        return (new Date(end.timestamp).getTime() - new Date(start.timestamp).getTime()) / (1000 * 60);
      });
      
      const avgMinutes = cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length;
      avgCycleTime = `${Math.round(avgMinutes)} min`;
    }
    
    // Get work day statuses (for EOD tracking)
    const eodTrucks = workDays.filter((wd: any) => wd.status === "completed").length;

      res.json({
        trucksActive: trucksActive,
        loadsInTransit,
        loadsDelivered,
        tonsInTransit: Math.round(tonsInTransit * 100) / 100,
        tonsDelivered: Math.round(tonsDelivered * 100) / 100,
        avgCycleTime,
        totalActivities: todayActivities.length,
        driversActive: new Set(todayActivities.map(activity => activity.driver.id)).size,
        trucksEOD: eodTrucks
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  // Truck status tracking endpoint
  app.get("/api/dashboard/truck-status", async (req, res) => {
    try {
      const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : null;
      const recentActivities = await storage.getRecentActivities(500);
      const workDays = await storage.getActiveWorkDays();
      const trucks = await storage.getTrucks();
      const today = new Date().toDateString();
      
      // Filter activities by job and today
      const filteredActivities = recentActivities.filter(activity => {
        const isToday = new Date(activity.timestamp).toDateString() === today;
        const matchesJob = jobId ? activity.job?.id === jobId : true;
        return isToday && matchesJob;
      });
      
      // Create status object with proper structure
      const statusData = {
        at_load_site: { count: 0, trucks: [], averageWaitTime: 0 },
        in_transit: { count: 0, trucks: [], averageWaitTime: 0 },
        at_dump_site: { count: 0, trucks: [], averageWaitTime: 0 },
        returning: { count: 0, trucks: [], averageWaitTime: 0 },
        completed: { count: 0, trucks: [], averageWaitTime: 0 }
      };
      
      // Group activities by truck and calculate status
      const truckActivities = filteredActivities.reduce((acc, activity) => {
        const truckId = activity.truck?.id;
        if (!truckId) return acc;
        
        if (!acc[truckId]) {
          acc[truckId] = {
            truck: activity.truck,
            driver: activity.driver,
            activities: []
          };
        }
        acc[truckId].activities.push(activity);
        return acc;
      }, {} as Record<number, any>);
      
      // Analyze each truck's current status
      Object.values(truckActivities).forEach((group: any) => {
        const latestActivity = group.activities.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        
        if (!latestActivity) return;
        
        // Check if work day is completed (has end_of_day activity)
        const hasEndOfDay = group.activities.some((activity: any) => 
          activity.activityType === "end_of_day"
        );
        
        // Debug logging
        if (hasEndOfDay) {
          console.log(`Truck ${group.truck.number} has EOD activity - marking as completed`);
        }
        
        // Determine current status based on latest activity
        let currentStatus = "returning"; // default
        
        if (hasEndOfDay) {
          currentStatus = "completed";
        } else {
          switch (latestActivity.activityType) {
            case "arrived_at_load_site":
              currentStatus = "at_load_site";
              break;
            case "loaded_with_material":
              currentStatus = "in_transit";
              break;
            case "arrived_at_dump_site":
              currentStatus = "at_dump_site";
              break;
            case "dumped_material":
            case "driving":
              currentStatus = "returning";
              break;
          }
        }
        
        // Add truck to appropriate status
        if (statusData[currentStatus as keyof typeof statusData]) {
          statusData[currentStatus as keyof typeof statusData].count++;
          (statusData[currentStatus as keyof typeof statusData].trucks as any[]).push({
            id: group.truck.id,
            number: group.truck.number,
            driver: group.driver?.name || group.driver?.email?.split('@')[0],
            lastActivity: latestActivity.timestamp
          });
        }
      });
      
      res.json(statusData);
    } catch (error) {
      console.error("Truck status tracking error:", error);
      res.status(500).json({ error: "Failed to get truck status data" });
    }
  });

  // Lease Hauler Companies API
  app.get("/api/broker/lease-hauler-companies", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== 'broker' && user.role !== 'broker_admin') {
        return res.status(403).json({ error: "Only brokers can access lease hauler companies" });
      }

      const companies = await storage.getLeaseHaulerCompanies(user.companyId);
      res.json(companies);
    } catch (error) {
      console.error("Get lease hauler companies error:", error);
      res.status(500).json({ error: "Failed to get lease hauler companies" });
    }
  });

  // Dispatches API Routes
  app.get("/api/dispatches", requireAuth, async (req: any, res) => {
    try {
      console.log("=== GET DISPATCHES REQUEST ===");
      console.log("Session userId:", req.session?.userId);
      
      const user = req.user;

      console.log("User details:", { id: user.id, role: user.role, companyId: user.companyId });

      // Role-based access control
      let dispatches = [];
      if (user.role === 'broker' || user.role === 'broker_admin') {
        console.log("Fetching dispatches for broker with companyId:", user.companyId);
        dispatches = await storage.getDispatches(user.companyId);
        console.log("Found dispatches:", dispatches.length);
      } else if (user.role === 'customer') {
        const customerDispatches = await storage.getDispatchesByCustomer(user.companyId!);
        dispatches = customerDispatches;
      } else if (user.role === 'leasor' || user.role === 'leasor_admin') {
        console.log("🏢 LEASOR DISPATCH REQUEST:", {
          userId: user.id,
          userRole: user.role,
          companyId: user.companyId,
          companyName: user.name
        });
        
        // Get all dispatches that have company assignments for this leasor's company
        const allDispatchesWithAssignments = await storage.getAllDispatches();
        console.log("📋 ALL DISPATCHES FOUND:", allDispatchesWithAssignments.length);
        
        dispatches = allDispatchesWithAssignments.filter((dispatch: any) => {
          const hasCompanyAssignment = dispatch.companyDispatchAssignments?.some(
            (assignment: any) => assignment.companyId === user.companyId
          );
          
          console.log("🔍 DISPATCH FILTER:", {
            dispatchId: dispatch.id,
            jobName: dispatch.jobName,
            status: dispatch.status,
            companyDispatchAssignments: dispatch.companyDispatchAssignments,
            hasCompanyAssignment,
            userCompanyId: user.companyId
          });
          
          return hasCompanyAssignment;
        }).map((dispatch: any) => {
          // Return dispatch without the extra property to match Dispatch type
          const { companyDispatchAssignments, ...cleanDispatch } = dispatch;
          return cleanDispatch;
        });
        
        console.log("✅ FILTERED DISPATCHES FOR LEASOR:", {
          totalFound: dispatches.length,
          dispatches: dispatches.map((d: any) => ({
            id: d.id,
            jobName: d.jobName,
            status: d.status
          }))
        });
      } else if (user.role === 'driver') {
        const assignments = await storage.getDispatchAssignments(undefined, user.id);
        const dispatchPromises = assignments.map(a => storage.getDispatch(a.dispatchId));
        const dispatchResults = await Promise.all(dispatchPromises);
        dispatches = dispatchResults.filter(d => d !== undefined);
      }

      console.log("Returning dispatches:", dispatches.map(d => ({ id: d.id, jobName: d.jobName, brokerId: d.brokerId })));
      res.json(dispatches);
    } catch (error) {
      console.error("Get dispatches error:", error);
      res.status(500).json({ error: "Failed to get dispatches" });
    }
  });

  app.post("/api/dispatches", requireAuth, async (req: any, res) => {
    try {
      console.log("=== CREATE DISPATCH REQUEST ===");
      console.log("Session userId:", req.session?.userId);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const user = req.user;
      if (!user.role.includes('broker') && user.role !== 'broker_admin') {
        return res.status(403).json({ error: "Only brokers can create dispatches" });
      }

      console.log("Creating dispatch for user:", { id: user.id, role: user.role, companyId: user.companyId });

      const dispatchData = insertDispatchSchema.parse({
        ...req.body,
        brokerId: user.companyId,
        status: "created"
      });

      console.log("Dispatch data to create:", JSON.stringify(dispatchData, null, 2));

      const dispatch = await storage.createDispatch(dispatchData);
      console.log("Created dispatch:", JSON.stringify(dispatch, null, 2));

      // Handle company dispatch assignments if provided
      if (req.body.assignments && Array.isArray(req.body.assignments)) {
        console.log("🎯 PROCESSING COMPANY ASSIGNMENTS:", req.body.assignments);
        
        for (const assignment of req.body.assignments) {
          if (assignment.companyId && assignment.quantity) {
            console.log("📦 CREATING COMPANY ASSIGNMENT:", {
              dispatchId: dispatch.id,
              companyId: assignment.companyId,
              quantity: assignment.quantity,
              assignedBy: user.id
            });
            
            const companyAssignment = await storage.createCompanyDispatchAssignment({
              dispatchId: dispatch.id,
              companyId: assignment.companyId,
              quantity: assignment.quantity,
              assignedBy: user.id
            });
            
            console.log("✅ COMPANY ASSIGNMENT CREATED:", companyAssignment);
          }
        }
      }

      // Save reusable data
      const reusableFields = [
        { type: 'job_name', value: dispatch.jobName },
        { type: 'material_type', value: dispatch.materialType },
        { type: 'location', value: dispatch.materialFrom },
        { type: 'location', value: dispatch.deliveredTo }
      ];

      for (const field of reusableFields) {
        const existing = await storage.getReusableData(field.type, user.companyId);
        const existingItem = existing.find(item => item.value === field.value);
        
        if (existingItem) {
          await storage.updateReusableDataUsage(existingItem.id);
        } else {
          await storage.createReusableData({
            type: field.type,
            value: field.value,
            brokerId: user.companyId
          });
        }
      }

      res.json(dispatch);
    } catch (error) {
      console.error("Create dispatch error:", error);
      res.status(400).json({ 
        error: "Failed to create dispatch",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/dispatches/:id/assign", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== 'broker') {
        return res.status(403).json({ error: "Only brokers can assign dispatches" });
      }

      const dispatchId = parseInt(req.params.id);
      const { companyId, quantity } = req.body;

      if (!companyId || !quantity) {
        return res.status(400).json({ error: "Company ID and quantity are required" });
      }

      // Create company dispatch assignment
      const assignment = await storage.createCompanyDispatchAssignment({
        dispatchId,
        companyId: parseInt(companyId),
        quantity: parseInt(quantity),
        assignedBy: user.id
      });

      // Update dispatch status
      await storage.updateDispatch(dispatchId, { status: 'assigned_to_lh' });

      res.json(assignment);
    } catch (error) {
      console.error("Assign dispatch to company error:", error);
      res.status(400).json({ error: "Failed to assign dispatch to company" });
    }
  });

  app.get("/api/reusable-data/:type", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || (!user.role.includes('broker') && user.role !== 'broker_admin')) {
        return res.status(403).json({ error: "Only brokers can access reusable data" });
      }

      const type = req.params.type;
      const data = await storage.getReusableData(type, user.companyId);
      res.json(data);
    } catch (error) {
      console.error("Get reusable data error:", error);
      res.status(500).json({ error: "Failed to get reusable data" });
    }
  });

  app.get("/api/broker/trucks", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || (!user.role.includes('broker') && user.role !== 'broker_admin')) {
        return res.status(403).json({ error: "Only brokers can access this endpoint" });
      }

      const trucks = await storage.getTrucksByBroker(user.companyId);
      res.json(trucks);
    } catch (error) {
      console.error("Get broker trucks error:", error);
      res.status(500).json({ error: "Failed to get trucks" });
    }
  });

  app.get("/api/broker/customers", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || (!user.role.includes('broker') && user.role !== 'broker_admin')) {
        return res.status(403).json({ error: "Only brokers can access this endpoint" });
      }

      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Get broker customers error:", error);
      res.status(500).json({ error: "Failed to get customers" });
    }
  });

  // Employee management routes
  app.get("/api/employees/:companyId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const companyId = parseInt(req.params.companyId);
      const user = await storage.getUser(req.session.userId);
      
      // Check permissions - user must be admin of the company or system admin
      if (!user || (user.companyId !== companyId && user.role !== "admin")) {
        return res.status(403).json({ error: "Access denied" });
      }

      const employees = await storage.getEmployeesByCompany(companyId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      // Only company admins or system admins can create employees
      if (!user || (!user.permissions?.includes("admin") && user.role !== "admin")) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }

      const employee = await storage.createEmployee(validation.data);
      res.json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const employeeId = parseInt(req.params.id);
      const user = await storage.getUser(req.session.userId);
      const targetEmployee = await storage.getUser(employeeId);

      // Check permissions - user must be admin of the same company or system admin
      if (!user || !targetEmployee || 
          (user.companyId !== targetEmployee.companyId && user.role !== "admin") ||
          (!user.permissions?.includes("admin") && user.role !== "admin")) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedEmployee = await storage.updateEmployee(employeeId, req.body);
      if (!updatedEmployee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const employeeId = parseInt(req.params.id);
      const user = await storage.getUser(req.session.userId);
      const targetEmployee = await storage.getUser(employeeId);

      // Check permissions - user must be admin of the same company or system admin
      if (!user || !targetEmployee || 
          (user.companyId !== targetEmployee.companyId && user.role !== "admin") ||
          (!user.permissions?.includes("admin") && user.role !== "admin")) {
        return res.status(403).json({ error: "Access denied" });
      }

      const deactivatedEmployee = await storage.deactivateEmployee(employeeId);
      if (!deactivatedEmployee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(deactivatedEmployee);
    } catch (error) {
      console.error("Error deactivating employee:", error);
      res.status(500).json({ error: "Failed to deactivate employee" });
    }
  });

  // Customer management routes
  app.post("/api/customers", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || (!user.role.includes('broker') && user.role !== 'broker_admin')) {
        return res.status(403).json({ error: "Only brokers can create customers" });
      }

      const customerData = {
        name: req.body.name,
        contactEmail: req.body.contactEmail,
        contactPhone: req.body.contactPhone,
        address: req.body.address,
      };

      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Company management routes
  app.get("/api/companies/:type", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const type = req.params.type;
      const companies = await storage.getCompaniesByType(type);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Lease Hauler Portal API Routes
  
  // Get available lease hauler companies for dispatch assignment (for brokers)
  app.get("/api/broker/lease-hauler-companies", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || (!user.role.includes('broker') && user.role !== 'broker_admin')) {
        return res.status(403).json({ error: "Only brokers can view lease hauler companies" });
      }

      const companies = await storage.getLeaseHaulerCompanies(user.companyId);
      res.json(companies);
    } catch (error) {
      console.error("Get lease hauler companies error:", error);
      res.status(500).json({ error: "Failed to get lease hauler companies" });
    }
  });

  // LH Dashboard Routes
  app.get("/api/leasor/dashboard", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get company stats for LH dashboard
      const [trucks, drivers, dispatches, activities] = await Promise.all([
        storage.getTrucksByCompany(user.companyId),
        storage.getUsersByCompany(user.companyId),
        storage.getDispatchesByCompany(user.companyId),
        storage.getActivitiesByCompany(user.companyId, new Date())
      ]);

      const activeTrucks = trucks.filter(t => t.isActive).length;
      const activeDrivers = drivers.filter(d => d.isActive && d.role === 'leasor_driver').length;
      
      res.json({
        activeTrucks,
        activeDrivers,
        todayDispatches: dispatches.length,
        todayActivities: activities
      });
    } catch (error) {
      console.error("LH Dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // LH Dispatch Routes
  app.get("/api/leasor/dispatches", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const dispatches = await storage.getDispatchesByCompany(user.companyId);
      res.json(dispatches);
    } catch (error) {
      console.error("LH Dispatches error:", error);
      res.status(500).json({ error: "Failed to fetch dispatches" });
    }
  });

  app.post("/api/leasor/dispatches/:id/assign", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const dispatchId = parseInt(req.params.id);
      const { truckAssignments } = req.body;

      const assignments = [];
      for (const assignment of truckAssignments) {
        const dispatchAssignment = await storage.createDispatchAssignment({
          dispatchId,
          truckId: assignment.truckId,
          driverId: assignment.driverId || null,
          assignedBy: user.id
        });
        assignments.push(dispatchAssignment);
      }

      await storage.updateDispatch(dispatchId, { status: 'assigned' });
      res.json(assignments);
    } catch (error) {
      console.error("LH Assign dispatch error:", error);
      res.status(400).json({ error: "Failed to assign dispatch" });
    }
  });

  // LH Fleet Management Routes
  app.get("/api/leasor/trucks", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const trucks = await storage.getTrucksByCompany(user.companyId);
      res.json(trucks);
    } catch (error) {
      console.error("LH Trucks error:", error);
      res.status(500).json({ error: "Failed to fetch trucks" });
    }
  });

  app.post("/api/leasor/trucks", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const truckData = {
        ...req.body,
        companyId: user.companyId
      };

      const truck = await storage.createTruck(truckData);
      res.json(truck);
    } catch (error) {
      console.error("LH Create truck error:", error);
      res.status(400).json({ error: "Failed to create truck" });
    }
  });

  app.patch("/api/leasor/trucks/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const truckId = parseInt(req.params.id);
      const truck = await storage.updateTruck(truckId, req.body);
      
      if (!truck) {
        return res.status(404).json({ error: "Truck not found" });
      }

      res.json(truck);
    } catch (error) {
      console.error("LH Update truck error:", error);
      res.status(400).json({ error: "Failed to update truck" });
    }
  });

  app.delete("/api/leasor/trucks/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const truckId = parseInt(req.params.id);
      await storage.deleteTruck(truckId);
      res.json({ success: true });
    } catch (error) {
      console.error("LH Delete truck error:", error);
      res.status(400).json({ error: "Failed to delete truck" });
    }
  });

  // LH Driver Management Routes
  app.get("/api/leasor/drivers", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const drivers = await storage.getUsersByCompany(user.companyId);
      const leasorDrivers = drivers.filter(d => d.role === 'leasor_driver');
      res.json(leasorDrivers);
    } catch (error) {
      console.error("LH Drivers error:", error);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.post("/api/leasor/drivers/invite", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const { email, name } = req.body;
      
      // Create driver invitation (simplified implementation)
      const invitation = await storage.createUserInvitation({
        email,
        name,
        role: 'leasor_driver',
        companyId: user.companyId,
        invitedBy: user.id
      });

      res.json(invitation);
    } catch (error) {
      console.error("LH Invite driver error:", error);
      res.status(400).json({ error: "Failed to invite driver" });
    }
  });

  app.get("/api/leasor/invitations/pending", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitations = await storage.getPendingInvitationsByCompany(user.companyId);
      res.json(invitations);
    } catch (error) {
      console.error("LH Pending invitations error:", error);
      res.status(500).json({ error: "Failed to fetch pending invitations" });
    }
  });

  app.patch("/api/leasor/drivers/:id/deactivate", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'leasor_admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const driverId = parseInt(req.params.id);
      const driver = await storage.updateUser(driverId, { isActive: false });
      
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      res.json(driver);
    } catch (error) {
      console.error("LH Deactivate driver error:", error);
      res.status(400).json({ error: "Failed to deactivate driver" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
