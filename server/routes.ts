import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertWorkDaySchema, insertActivitySchema } from "@shared/schema";
import "./types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session and save it
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
      });
      
      console.log("Login successful, session set:", req.session.userId);
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
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
    console.log("Auth check - Session ID:", req.sessionID);
    console.log("Auth check - User ID in session:", req.session?.userId);
    
    // Development bypass - auto-login as driver for testing
    if (!req.session?.userId) {
      const defaultUser = await storage.getUserByEmail("mike.johnson@company.com");
      if (defaultUser) {
        req.session.userId = defaultUser.id;
        console.log("Auto-logged in as driver for development");
        
        // Ensure the driver has an active work day
        const existingWorkDay = await storage.getActiveWorkDayByDriver(defaultUser.id);
        if (!existingWorkDay) {
          const trucks = await storage.getTrucks();
          const jobs = await storage.getActiveJobs();
          
          if (trucks.length > 0 && jobs.length > 0) {
            const workDay = await storage.createWorkDay({
              driverId: defaultUser.id,
              truckId: trucks[0].id,
              jobId: jobs[0].id,
              startTime: new Date().toISOString(),
              endTime: null,
              signature: null,
              notes: null,
              status: "active"
            });
            console.log("Created work day for development:", workDay.id);
          }
        }
      }
    }

    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    console.log("Auth check successful for user:", user.email);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // Setup data endpoints
  app.get("/api/trucks", async (req, res) => {
    const trucks = await storage.getTrucks();
    res.json(trucks);
  });

  app.get("/api/jobs", async (req, res) => {
    const jobs = await storage.getActiveJobs();
    res.json(jobs);
  });

  app.get("/api/customers", async (req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get("/api/materials", async (req, res) => {
    const materials = await storage.getMaterials();
    res.json(materials);
  });

  app.get("/api/locations", async (req, res) => {
    const type = req.query.type as string;
    const locations = type 
      ? await storage.getLocationsByType(type)
      : await storage.getLocations();
    res.json(locations);
  });

  // Work day management

  app.post("/api/work-days", async (req, res) => {
    try {
      if (!req.session?.userId) {
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
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const workDay = await storage.updateWorkDay(id, updates);
      if (!workDay) {
        return res.status(404).json({ error: "Work day not found" });
      }
      
      res.json(workDay);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Activity logging
  app.post("/api/activities", async (req, res) => {
    try {
      console.log("Creating activity with request body:", req.body);
      const { workDayId, loadNumber, activityType, timestamp, latitude, longitude, notes, ticketNumber, netWeight } = req.body;
      
      if (!workDayId || !loadNumber || !activityType || !timestamp) {
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
    const trucks = await storage.getTrucks();
    const recentActivities = await storage.getRecentActivities(100);
    const today = new Date().toDateString();
    
    // Calculate today's activities
    const todayActivities = recentActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
    );
    
    // Active trucks (trucks with activity in last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const activeTrucks = new Set(
      recentActivities
        .filter(activity => new Date(activity.timestamp) > twoHoursAgo)
        .map(activity => activity.truck.id)
    ).size;
    
    // Loads completed today
    const loadsToday = todayActivities.filter(activity => activity.activityType === "dumped_material").length;
    
    // Calculate average cycle time from actual data
    let avgCycleTime = "--";
    const completedLoads = todayActivities.filter(activity => activity.activityType === "dumped_material");
    if (completedLoads.length > 0) {
      // Group activities by driver and load number
      const loadGroups = todayActivities.reduce((acc, activity) => {
        const key = `${activity.driver.id}-${activity.loadNumber}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(activity);
        return acc;
      }, {} as Record<string, typeof todayActivities>);
      
      const cycleTimes = Object.values(loadGroups)
        .filter(loadActivities => loadActivities.some(a => a.activityType === "dumped_material"))
        .map(loadActivities => {
          const sorted = loadActivities.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          const start = sorted[0];
          const end = sorted[sorted.length - 1];
          return (new Date(end.timestamp).getTime() - new Date(start.timestamp).getTime()) / (1000 * 60);
        });
      
      if (cycleTimes.length > 0) {
        const avgMinutes = cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length;
        avgCycleTime = `${Math.round(avgMinutes)} min`;
      }
    }
    
    // Calculate total dirt moved today
    const dirtMovedToday = todayActivities
      .filter(activity => activity.activityType === "loaded_with_material" && activity.netWeight)
      .reduce((sum, activity) => sum + (parseFloat(activity.netWeight || "0") || 0), 0);

    res.json({
      activeTrucks,
      loadsToday,
      avgCycleTime,
      dirtMovedToday: Math.round(dirtMovedToday * 100) / 100,
      totalActivities: todayActivities.length,
      driversActive: new Set(todayActivities.map(activity => activity.driver.id)).size
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
