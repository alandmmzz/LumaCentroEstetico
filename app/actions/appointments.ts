"use server"

import { db } from "@/lib/db"
import { appointments, serviceCategories, serviceTreatments } from "@/lib/db/schema"
import { getAllServiceCatalog } from "@/lib/db/services"
import { getServicePrice, SERVICE_CATEGORIES } from "@/lib/services"
import { getScheduleForCategory, isOnlineCategory } from "@/lib/schedule"
import { createMercadoPagoPreference, getMercadoPagoPayment, isMercadoPagoEnabled } from "@/lib/mercadopago"
import { and, desc, eq, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type BookingResult = { ok: boolean; error?: string; id?: number }

export async function createAppointment(formData: FormData): Promise<BookingResult> {
  const name = String(formData.get("name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
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
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.appointmentDate, appointmentDate),
        eq(appointments.appointmentTime, appointmentTime),
        ne(appointments.status, "cancelado"),
      ),
    )
  if (existingAtTime.length >= 2) {
    return { ok: false, error: "Ese horario acaba de ocuparse. Elegí otro." }
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
    .select({ appointmentTime: appointments.appointmentTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.appointmentDate, appointmentDate),
        ne(appointments.status, "cancelado"),
      ),
    )
  const counts = rows.reduce<Record<string, number>>((result, row) => {
    result[row.appointmentTime] = (result[row.appointmentTime] ?? 0) + 1
    return result
  }, {})
  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([time]) => time)
}

export async function updateStatus(id: number, status: string) {
  await db.update(appointments).set({ status }).where(eq(appointments.id, id))
  revalidatePath("/admin")
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
