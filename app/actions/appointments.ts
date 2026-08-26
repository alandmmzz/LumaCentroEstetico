"use server"

import { db } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { getServicePrice, SERVICE_CATEGORIES } from "@/lib/services"
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

export async function getAppointmentById(id: number) {
  const [row] = await db.select().from(appointments).where(eq(appointments.id, id))
  return row ?? null
}

export async function getBookedTimes(appointmentDate: string) {
  const rows = await db
    .select({ appointmentTime: appointments.appointmentTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.appointmentDate, appointmentDate),
        ne(appointments.status, "cancelado"),
      ),
    )
  return rows.map((r) => r.appointmentTime)
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
