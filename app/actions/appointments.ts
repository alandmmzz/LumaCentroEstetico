"use server"

import { db } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { and, desc, eq, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const SERVICES = [
  "Nails",
  "Pedicura",
  "Depilación",
  "Masajes descontracturantes",
  "Cosmetología",
]

export type BookingResult = { ok: boolean; error?: string }

export async function createAppointment(formData: FormData): Promise<BookingResult> {
  const name = String(formData.get("name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const service = String(formData.get("service") ?? "").trim()
  const appointmentDate = String(formData.get("appointmentDate") ?? "").trim()
  const appointmentTime = String(formData.get("appointmentTime") ?? "").trim()

  if (!name || !phone || !service || !appointmentDate || !appointmentTime) {
    return { ok: false, error: "Por favor completá todos los campos." }
  }

  if (!SERVICES.includes(service)) {
    return { ok: false, error: "Seleccioná un servicio válido." }
  }

  const selected = new Date(`${appointmentDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (Number.isNaN(selected.getTime()) || selected < today) {
    return { ok: false, error: "Elegí una fecha válida a partir de hoy." }
  }

  await db.insert(appointments).values({
    name,
    phone,
    service,
    appointmentDate,
    appointmentTime,
  })

  revalidatePath("/admin")
  return { ok: true }
}

export async function getAppointments() {
  return db.select().from(appointments).orderBy(desc(appointments.createdAt))
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
