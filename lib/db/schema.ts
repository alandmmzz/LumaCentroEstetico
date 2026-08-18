import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core"

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  service: text("service").notNull(),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  status: text("status").notNull().default("pendiente"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type Appointment = typeof appointments.$inferSelect
