import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core"

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  service: text("service").notNull(),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  status: text("status").notNull().default("pendiente"),
  price: integer("price").notNull().default(0),
  depositPercentage: integer("deposit_percentage").notNull().default(0),
  depositAmount: integer("deposit_amount").notNull().default(0),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").notNull().default("pendiente"),
  mpPreferenceId: text("mp_preference_id"),
  mpPaymentId: text("mp_payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type Appointment = typeof appointments.$inferSelect
