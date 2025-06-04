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
        returning: { count: 0, trucks: [], averageWaitTime: 0 }
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
        
        // Determine current status based on latest activity
        let currentStatus = "returning"; // default
        
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

  const httpServer = createServer(app);
  return httpServer;
}
