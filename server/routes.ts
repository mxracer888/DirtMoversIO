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
      const { workDayId, loadNumber, activityType, timestamp, latitude, longitude, notes } = req.body;
      
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
      };
      
      const activity = await storage.createActivity(activityData);
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
    const activities = await storage.getActivitiesByWorkDay(workDayId);
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
    const recentActivities = await storage.getRecentActivities(50);
    
    const activeTrucks = trucks.filter(truck => truck.isActive).length;
    const loadsToday = recentActivities.filter(activity => 
      activity.activityType === "dumped_material" &&
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    ).length;

    res.json({
      activeTrucks,
      loadsToday,
      avgCycleTime: "28 min", // This would be calculated from actual data
      revenueToday: "$14,250", // This would be calculated from actual pricing
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
