import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("driver"), // driver, broker_admin, broker_employee, customer_admin, customer_employee, leasor_admin, leasor_employee, admin
  companyId: integer("company_id").notNull(),
  brokerId: integer("broker_id"), // For customers and leasors to link to their broker
  permissions: text("permissions").default("basic"), // basic, admin, full - controls what user can do within their role
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // broker, leasor, customer
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trucks = pgTable("trucks", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  type: text("type").notNull(), // Side Dump, Super Side Dump, etc.
  companyId: integer("company_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  customerId: integer("customer_id").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("active"), // active, completed, cancelled
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // A1A, A1B, State Spec Road Base, etc.
  pricePerLoad: decimal("price_per_load", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  type: text("type").notNull(), // source, destination
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workDays = pgTable("work_days", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  truckId: integer("truck_id").notNull(),
  jobId: integer("job_id").notNull(),
  workDate: timestamp("work_date").notNull(),
  materialId: integer("material_id").notNull(),
  sourceLocationId: integer("source_location_id").notNull(),
  destinationLocationId: integer("destination_location_id").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: text("status").default("active"), // active, completed, cancelled
  totalLoads: integer("total_loads").default(0),
  driverSignature: text("driver_signature"),
  operatorName: text("operator_name"),
  operatorSignature: text("operator_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  workDayId: integer("work_day_id").notNull(),
  loadNumber: integer("load_number").notNull(),
  activityType: text("activity_type").notNull(), // arrived_at_load_site, loaded_with_material, arrived_at_dump_site, dumped_material, break, breakdown, driving
  timestamp: timestamp("timestamp").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  notes: text("notes"),
  ticketNumber: text("ticket_number"), // For load data
  netWeight: text("net_weight"), // For load data in tons (stored as text for flexibility)
  cancelled: boolean("cancelled").default(false).notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Broker-Leasor relationships
export const brokerLeasorRelationships = pgTable("broker_leasor_relationships", {
  id: serial("id").primaryKey(),
  brokerId: integer("broker_id").notNull(),
  leasorId: integer("leasor_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dispatches
export const dispatches = pgTable("dispatches", {
  id: serial("id").primaryKey(),
  jobName: text("job_name").notNull(),
  invoiceJobName: text("invoice_job_name"),
  brokerId: integer("broker_id").notNull(),
  customerId: integer("customer_id").notNull(),
  date: text("date").notNull(), // Store as ISO date string
  startTime: text("start_time").notNull(), // Store as time string (HH:MM)
  truckType: text("truck_type").notNull(),
  quantity: integer("quantity").notNull(),
  materialType: text("material_type").notNull(),
  materialFrom: text("material_from").notNull(),
  deliveredTo: text("delivered_to").notNull(),
  account: text("account"),
  travelTime: integer("travel_time").notNull(), // in minutes
  materialFromGpsPin: text("material_from_gps_pin"),
  deliveredToGpsPin: text("delivered_to_gps_pin"),
  status: text("status").default("created"), // created, assigned, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dispatch assignments to trucks/drivers
export const dispatchAssignments = pgTable("dispatch_assignments", {
  id: serial("id").primaryKey(),
  dispatchId: integer("dispatch_id").notNull(),
  truckId: integer("truck_id").notNull(),
  driverId: integer("driver_id"),
  assignedBy: integer("assigned_by").notNull(), // User ID who made the assignment
  status: text("status").default("assigned"), // assigned, accepted, in_progress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reusable dropdown data
export const reusableData = pgTable("reusable_data", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // job_name, material_type, location, customer, account
  value: text("value").notNull(),
  brokerId: integer("broker_id").notNull(), // Scoped to broker
  usageCount: integer("usage_count").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertTruckSchema = createInsertSchema(trucks).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertWorkDaySchema = createInsertSchema(workDays).omit({
  id: true,
  createdAt: true,
  totalLoads: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertBrokerLeasorRelationshipSchema = createInsertSchema(brokerLeasorRelationships).omit({
  id: true,
  createdAt: true,
});

export const insertDispatchSchema = createInsertSchema(dispatches).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string(),
  startTime: z.string(),
});

export const insertDispatchAssignmentSchema = createInsertSchema(dispatchAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertReusableDataSchema = createInsertSchema(reusableData).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Truck = typeof trucks.$inferSelect;
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type WorkDay = typeof workDays.$inferSelect;
export type InsertWorkDay = z.infer<typeof insertWorkDaySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type BrokerLeasorRelationship = typeof brokerLeasorRelationships.$inferSelect;
export type InsertBrokerLeasorRelationship = z.infer<typeof insertBrokerLeasorRelationshipSchema>;
export type Dispatch = typeof dispatches.$inferSelect;
export type InsertDispatch = z.infer<typeof insertDispatchSchema>;
export type DispatchAssignment = typeof dispatchAssignments.$inferSelect;
export type InsertDispatchAssignment = z.infer<typeof insertDispatchAssignmentSchema>;
export type ReusableData = typeof reusableData.$inferSelect;
export type InsertReusableData = z.infer<typeof insertReusableDataSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
