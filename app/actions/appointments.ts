"use server"

import { db } from "@/lib/db"
import { appointments, serviceCategories, serviceTreatments, staff } from "@/lib/db/schema"
import { getAllServiceCatalog } from "@/lib/db/services"
import { getServicePrice, SERVICE_CATEGORIES } from "@/lib/services"
import { getScheduleForCategory, isOnlineCategory } from "@/lib/schedule"
import { createMercadoPagoPreference, getMercadoPagoPayment, isMercadoPagoEnabled } from "@/lib/mercadopago"
import { and, asc, desc, eq, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type BookingResult = { ok: boolean; error?: string; id?: number }

function getAppointmentCategory(service: string) {
  try {
    const parsed = JSON.parse(service) as { category?: string }
    return parsed.category?.trim() ?? service.trim()
  } catch {
    return service.trim()
  }
}

export async function createAppointment(formData: FormData): Promise<BookingResult> {
  const name = String(formData.get("name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const service = String(formData.get("service") ?? "").trim()
  const appointmentDate = String(formData.get("appointmentDate") ?? "").trim()
  const appointmentTime = String(formData.get("appointmentTime") ?? "").trim()

  if (!name || !phone || !service || !appointmentDate || !appointmentTime) {
    return { ok: false, error: "Por favor completá todos los campos." }
  }

  let selection: { category: string; treatmentIds: string[] }
  try {
    selection = JSON.parse(service)
  } catch {
    return { ok: false, error: "Seleccioná un tratamiento válido." }
  }
  const category = SERVICE_CATEGORIES.find((item) => item.name === selection.category)
  if (!isOnlineCategory(selection.category)) {
    return { ok: false, error: "Esta categoría se coordina por WhatsApp." }
  }
  const validIds = new Set(category?.treatments.map((treatment) => treatment.id) ?? [])
  if (!category || !Array.isArray(selection.treatmentIds) || selection.treatmentIds.length === 0 || selection.treatmentIds.some((id) => !validIds.has(id))) {
    return { ok: false, error: "Seleccioná al menos un tratamiento válido." }
  }

  const selected = new Date(`${appointmentDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (Number.isNaN(selected.getTime()) || selected < today) {
    return { ok: false, error: "Elegí una fecha válida a partir de hoy." }
  }

  const allowedTimes = getScheduleForCategory(selection.category)
  if (!allowedTimes.includes(appointmentTime)) {
    return { ok: false, error: "Elegí un horario disponible para esta categoría." }
  }

  const existingAtTime = await db
    .select({ id: appointments.id, service: appointments.service })
    .from(appointments)
    .where(
      and(
        eq(appointments.appointmentDate, appointmentDate),
        eq(appointments.appointmentTime, appointmentTime),
        ne(appointments.status, "cancelado"),
      ),
    )
  const sameCategory = existingAtTime.some((item) => getAppointmentCategory(item.service) === selection.category)
  if (sameCategory) {
    return { ok: false, error: `Ya existe un turno de ${selection.category} para ese día y horario.` }
  }
  if (existingAtTime.length >= 2) {
    return { ok: false, error: "Ese horario ya tiene dos servicios asignados. Elegí otro." }
  }

  const price = getServicePrice(service)
  if (price <= 0) {
    return { ok: false, error: "Para Depilación, consultá el precio antes de reservar." }
  }

  const [row] = await db
    .insert(appointments)
    .values({
      name,
      phone,
      email: email || null,
      service,
      appointmentDate,
      appointmentTime,
      price,
    })
    .returning({ id: appointments.id })

  revalidatePath("/admin")
  return { ok: true, id: row.id }
}

export async function getAppointments() {
  return db.select().from(appointments).orderBy(desc(appointments.createdAt))
}

export async function getStaff() {
  return db.select().from(staff).where(eq(staff.active, true)).orderBy(asc(staff.name))
}

export async function createStaff(name: string, email?: string) {
  if (!name.trim()) return { ok: false, error: "Ingresá un nombre." }
  await db.insert(staff).values({ name: name.trim(), email: email?.trim() || null })
  revalidatePath("/admin")
  return { ok: true }
}

export async function assignStaff(id: number, staffId: number | null) {
  const appointment = await getAppointmentById(id)
  if (!appointment) return { ok: false, error: "Turno no encontrado." }
  await db.update(appointments).set({ staffId, status: staffId ? "confirmado" : "pendiente" }).where(eq(appointments.id, id))
  if (staffId && appointment.email) {
    const [person] = await db.select().from(staff).where(eq(staff.id, staffId))
    if (person) await sendAppointmentEmail(appointment.email, appointment.name, person.name, appointment.appointmentDate, appointment.appointmentTime)
  }
  revalidatePath("/admin")
  return { ok: true }
}

async function sendAppointmentEmail(to: string, clientName: string, staffName: string, date: string, time: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) return
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to, subject: "Tu turno está confirmado · LUMA", html: `<p>Hola ${clientName},</p><p>Tenés un turno confirmado con ${staffName} el ${date} a las ${time} hs.</p><p>LUMA Centro Estético</p>` }) })
}

export async function updatePaymentManual(id: number, amount: number, status: string) {
  await db.update(appointments).set({ paymentReceived: Math.max(0, Math.round(amount)), paymentStatus: status }).where(eq(appointments.id, id))
  revalidatePath("/admin")
}

export async function createManualAppointment(data: { name: string; phone: string; email?: string; service: string; date: string; time: string; price: number }) {
  if (!data.name.trim() || !data.phone.trim() || !data.service.trim() || !data.date || !data.time) return { ok: false, error: "Completá los datos obligatorios." }
  const [row] = await db.insert(appointments).values({ name: data.name.trim(), phone: data.phone.trim(), email: data.email?.trim() || null, service: data.service.trim(), appointmentDate: data.date, appointmentTime: data.time, price: Math.max(0, Math.round(data.price)) }).returning({ id: appointments.id })
  revalidatePath("/admin")
  return { ok: true, id: row.id }
}

export async function getAdminServiceCatalog() {
  return getAllServiceCatalog()
}

export async function updateTreatmentPrice(id: number, price: number | null) {
  await db.update(serviceTreatments).set({ price }).where(eq(serviceTreatments.id, id))
  revalidatePath("/")
  revalidatePath("/admin")
}

export async function createTreatment(categoryId: number, name: string, price: number | null) {
  const cleanName = name.trim()
  if (!cleanName) return { ok: false, error: "Ingresá un nombre." }
  await db.insert(serviceTreatments).values({ categoryId, name: cleanName, price, sortOrder: 99 })
  revalidatePath("/")
  revalidatePath("/admin")
  return { ok: true }
}

export async function updateServiceCategory(id: number, name: string, description: string) {
  const cleanName = name.trim()
  if (!cleanName) return { ok: false, error: "Ingresá un nombre." }
  await db.update(serviceCategories).set({ name: cleanName, description: description.trim() }).where(eq(serviceCategories.id, id))
  revalidatePath("/")
  revalidatePath("/admin")
  return { ok: true }
}

export async function getAppointmentById(id: number) {
  const [row] = await db.select().from(appointments).where(eq(appointments.id, id))
  return row ?? null
}

export async function getBookedTimes(appointmentDate: string, category?: string) {
  const rows = await db
    .select({ appointmentTime: appointments.appointmentTime, service: appointments.service })
    .from(appointments)
    .where(
      and(
        eq(appointments.appointmentDate, appointmentDate),
        ne(appointments.status, "cancelado"),
      ),
    )
  const unavailable = rows.reduce<Record<string, { total: number; categories: Set<string> }>>((result, row) => {
    const current = result[row.appointmentTime] ?? { total: 0, categories: new Set<string>() }
    current.total += 1
    current.categories.add(getAppointmentCategory(row.service))
    result[row.appointmentTime] = current
    return result
  }, {})
  return Object.entries(unavailable)
    .filter(([, value]) => value.total >= 2 || (category ? value.categories.has(category) : false))
    .map(([time]) => time)
}

export async function updateStatus(id: number, status: string) {
  const appointment = await getAppointmentById(id)
  if (!appointment) return { ok: false, error: "Turno no encontrado." }
  const normalizedStatus = ["pendiente", "confirmado", "pago", "cancelado"].includes(status) ? status : "pendiente"
  await db.update(appointments).set({
    status: normalizedStatus,
    paymentReceived: normalizedStatus === "pago" ? (appointment.paymentReceived || appointment.price) : appointment.paymentReceived,
    paymentStatus: normalizedStatus === "pago" ? "pagado" : "pendiente",
  }).where(eq(appointments.id, id))
  revalidatePath("/admin")
  return { ok: true }
}

export async function deleteAppointment(id: number) {
  await db.delete(appointments).where(eq(appointments.id, id))
  revalidatePath("/admin")
}

// --- Checkout / pagos ---

export async function isMercadoPagoAvailable() {
  return isMercadoPagoEnabled()
}

function computeDeposit(price: number, percentage: number) {
  return Math.round((price * percentage) / 100)
}

export async function confirmBankTransfer(
  id: number,
  percentage: number,
): Promise<BookingResult> {
  const appointment = await getAppointmentById(id)
  if (!appointment) return { ok: false, error: "Turno no encontrado." }

  const depositAmount = computeDeposit(appointment.price, percentage)

  await db
    .update(appointments)
    .set({
      depositPercentage: percentage,
      depositAmount,
      paymentMethod: "transferencia",
      paymentStatus: "pendiente_verificacion",
    })
    .where(eq(appointments.id, id))

  revalidatePath("/admin")
  revalidatePath(`/reservar/${id}`)
  return { ok: true }
}

export async function createMercadoPagoCheckout(
  id: number,
  percentage: number,
): Promise<{ ok: true; initPoint: string } | { ok: false; error: string }> {
  const appointment = await getAppointmentById(id)
  if (!appointment) return { ok: false, error: "Turno no encontrado." }

  const depositAmount = computeDeposit(appointment.price, percentage)
  if (depositAmount <= 0) {
    return { ok: false, error: "El monto de la seña no es válido." }
  }

  const result = await createMercadoPagoPreference({
    appointmentId: id,
    title: `Seña ${percentage}% · ${appointment.service} · LUMA Centro Estético`,
    amount: depositAmount,
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  await db
    .update(appointments)
    .set({
      depositPercentage: percentage,
      depositAmount,
      paymentMethod: "mercadopago",
      paymentStatus: "pendiente",
      mpPreferenceId: result.preferenceId,
    })
    .where(eq(appointments.id, id))

  revalidatePath("/admin")
  return { ok: true, initPoint: result.initPoint }
}

export async function confirmMercadoPagoReturn(
  id: number,
  paymentId: string,
): Promise<BookingResult> {
  const result = await getMercadoPagoPayment(paymentId)
  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  const paymentStatus = result.status === "approved" ? "pagado" : result.status

  await db
    .update(appointments)
    .set({
      paymentStatus,
      mpPaymentId: paymentId,
      status: result.status === "approved" ? "confirmado" : undefined,
    })
    .where(eq(appointments.id, id))

  revalidatePath("/admin")
  revalidatePath(`/reservar/${id}`)
  return { ok: result.status === "approved" }
}

export async function markPaymentVerified(id: number) {
  await db
    .update(appointments)
    .set({ paymentStatus: "pagado", status: "confirmado" })
    .where(eq(appointments.id, id))
  revalidatePath("/admin")
}
