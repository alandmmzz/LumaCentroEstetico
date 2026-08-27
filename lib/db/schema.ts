import { pgTable, serial, text, integer, date, timestamp, boolean } from "drizzle-orm/pg-core"

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  service: text("service").notNull(),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  status: text("status").notNull().default("pendiente"),
  price: integer("price").notNull().default(0),
  depositPercentage: integer("deposit_percentage").notNull().default(0),
  depositAmount: integer("deposit_amount").notNull().default(0),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").notNull().default("pendiente"),
  paymentReceived: integer("payment_received").notNull().default(0),
  staffId: integer("staff_id"),
  mpPreferenceId: text("mp_preference_id"),
  mpPaymentId: text("mp_payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("sparkles"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
})

export const serviceTreatments = pgTable("service_treatments", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  price: integer("price"),
  note: text("note").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
})

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  adminAccess: boolean("admin_access").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type Appointment = typeof appointments.$inferSelect
export type Staff = typeof staff.$inferSelect
