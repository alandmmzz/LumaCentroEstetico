"use server"

import { db } from "@/lib/db"
import { appointments, serviceCategories, serviceTreatments, staff } from "@/lib/db/schema"
import { getAllServiceCatalog } from "@/lib/db/services"
import { formatServiceLabel, getServicePrice, SERVICE_CATEGORIES } from "@/lib/services"
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

  await sendAppointmentRequestEmail({
    to: process.env.ADMIN_EMAIL ?? "alandmarp11@gmail.com",
    clientName: name,
    email,
    phone,
    service,
    date: appointmentDate,
    time: appointmentTime,
  })
  revalidatePath("/admin")
  return { ok: true, id: row.id }
}

export async function getAppointments() {
  return db.select().from(appointments).orderBy(desc(appointments.createdAt))
}

export async function getStaff() {
  return db.select().from(staff).where(eq(staff.active, true)).orderBy(asc(staff.name))
}

export async function createStaff(name: string, email?: string, adminAccess = false) {
  if (!name.trim()) return { ok: false, error: "Ingresá un nombre." }
  await db.insert(staff).values({ name: name.trim(), email: email?.trim() || null, adminAccess })
  revalidatePath("/admin")
  return { ok: true }
}

export async function updateStaffAdminAccess(id: number, adminAccess: boolean) {
  const [person] = await db.select({ email: staff.email }).from(staff).where(eq(staff.id, id))
  if (!person?.email) return { ok: false, error: "La persona necesita un email para tener acceso admin." }
  await db.update(staff).set({ adminAccess }).where(eq(staff.id, id))
  revalidatePath("/admin")
  return { ok: true }
}

export async function assignStaff(id: number, staffId: number | null) {
  const appointment = await getAppointmentById(id)
  if (!appointment) return { ok: false, error: "Turno no encontrado." }
  await db.update(appointments).set({ staffId, status: staffId ? "confirmado" : "pendiente" }).where(eq(appointments.id, id))
  if (staffId && appointment.email && appointment.status !== "confirmado") {
    const [person] = await db.select().from(staff).where(eq(staff.id, staffId))
    if (person) await sendAppointmentEmail(appointment.email, appointment.name, person.name, appointment.appointmentDate, appointment.appointmentTime)
  }
  revalidatePath("/admin")
  return { ok: true }
}

type AppointmentEmail = { to: string; clientName: string; email?: string; phone: string; service: string; date: string; time: string }

function formatEmailDate(dateKey: string) {
  try {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString("es-UY", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  } catch {
    return dateKey
  }
}

// Layout base con la identidad de LUMA para todos los emails transaccionales.
function emailLayout(options: { preheader: string; eyebrow: string; heading: string; bodyHtml: string }) {
  const { preheader, eyebrow, heading, bodyHtml } = options
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f2ece1;font-family:Georgia,'Times New Roman',serif;">
    <span style="display:none;font-size:1px;color:#f2ece1;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2ece1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#fffdfa;border-radius:16px;overflow:hidden;border:1px solid #e7ddcc;">
            <tr>
              <td style="background-color:#b8976b;padding:28px 32px;text-align:center;">
                <span style="display:block;font-family:Georgia,serif;font-size:22px;letter-spacing:6px;color:#fffdfa;">LUMA</span>
                <span style="display:block;margin-top:4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:4px;color:#fffdfa;opacity:0.9;">CENTRO ESTÉTICO</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px 32px;text-align:center;">
                <span style="display:block;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#b8976b;">${eyebrow}</span>
                <h1 style="margin:10px 0 0 0;font-family:Georgia,serif;font-weight:normal;font-size:26px;color:#4a3f35;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#4a3f35;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 32px 32px;text-align:center;border-top:1px solid #eee4d3;margin-top:24px;">
                <span style="display:block;font-family:Georgia,serif;font-size:14px;color:#4a3f35;">LUMA Centro Estético</span>
                <span style="display:block;margin-top:4px;font-family:Arial,sans-serif;font-style:italic;font-size:12px;color:#8a7862;">Iluminamos tu belleza, potenciamos tu esencia.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function detailRow(icon: string, label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#4a3f35;" width="20">${icon}</td>
    <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#8a7862;" width="90">${label}</td>
    <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#4a3f35;font-weight:bold;">${value}</td>
  </tr>`
}

async function sendResendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? "no-reply@luma.com.uy"
  if (!key) {
    console.error("[v0] Resend email skipped: RESEND_API_KEY is not available in this deployment")
    return
  }
  if (!to) {
    console.error("[v0] Resend email skipped: recipient is empty")
    return
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!response.ok) {
      console.error("[v0] Resend rejected email", { status: response.status, details: await response.text() })
    } else {
      console.log("[v0] Resend email accepted", { to, subject })
    }
  } catch (error) {
    console.error("[v0] Resend email failed:", error)
  }
}

async function sendAppointmentRequestEmail(data: AppointmentEmail) {
  const serviceLabel = formatServiceLabel(data.service)
  const bodyHtml = `
    <p style="margin:0 0 20px 0;">Llegó una nueva solicitud de turno de <strong>${data.clientName}</strong>. Estos son los datos:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f4ea;border-radius:10px;padding:4px 16px;margin-bottom:8px;">
      ${detailRow("✨", "Servicio", serviceLabel)}
      ${detailRow("📅", "Fecha", formatEmailDate(data.date))}
      ${detailRow("⏰", "Hora", `${data.time} hs`)}
      ${detailRow("📞", "Teléfono", data.phone)}
      ${detailRow("✉️", "Email", data.email || "No informado")}
    </table>
    <p style="margin:20px 0 0 0;color:#8a7862;font-size:13px;">Asignale un profesional desde el panel de administración para confirmar el turno.</p>
  `
  await sendResendEmail(
    data.to,
    "Nueva solicitud de turno · LUMA",
    emailLayout({
      preheader: `Nueva solicitud de ${data.clientName} para ${serviceLabel}`,
      eyebrow: "Panel de reservas",
      heading: "Nueva solicitud de turno",
      bodyHtml,
    }),
  )
}

async function sendAppointmentEmail(to: string, clientName: string, staffName: string, date: string, time: string) {
  const bodyHtml = `
    <p style="margin:0 0 20px 0;">Hola ${clientName} ✨</p>
    <p style="margin:0 0 20px 0;">Nos alegra confirmar tu turno en <strong>LUMA Centro Estético</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f4ea;border-radius:10px;padding:4px 16px;margin-bottom:8px;">
      ${detailRow("📅", "Fecha", formatEmailDate(date))}
      ${detailRow("⏰", "Hora", `${time} hs`)}
      ${detailRow("💛", "Con", staffName)}
    </table>
    <p style="margin:20px 0 0 0;">Te esperamos para compartir un momento pensado especialmente para vos.</p>
    <p style="margin:16px 0 0 0;">Si necesitás realizar algún cambio o tenés alguna consulta, podés comunicarte con nosotras.</p>
    <p style="margin:20px 0 0 0;">Con cariño,</p>
  `
  await sendResendEmail(
    to,
    "Tu turno está confirmado · LUMA",
    emailLayout({
      preheader: `Tu turno del ${formatEmailDate(date)} a las ${time} hs quedó confirmado`,
      eyebrow: "Turno confirmado",
      heading: "¡Te esperamos! 🤍",
      bodyHtml,
    }),
  )
}

export async function updatePaymentManual(id: number, amount: number, status: string) {
  await db.update(appointments).set({ paymentReceived: Math.max(0, Math.round(amount)), paymentStatus: status }).where(eq(appointments.id, id))
  revalidatePath("/admin")
}

export async function createManualAppointment(data: { name: string; phone: string; email?: string; service: string; date: string; time: string; price: number; staffId?: number | null }) {
  if (!data.name.trim() || !data.phone.trim() || !data.service.trim() || !data.date || !data.time) return { ok: false, error: "Completá los datos obligatorios." }
  const [row] = await db.insert(appointments).values({ name: data.name.trim(), phone: data.phone.trim(), email: data.email?.trim() || null, service: data.service.trim(), appointmentDate: data.date, appointmentTime: data.time, staffId: data.staffId ?? null, price: Math.max(0, Math.round(data.price)) }).returning({ id: appointments.id })
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
  if (normalizedStatus === "confirmado" && appointment.status !== "confirmado" && appointment.email) {
    const person = appointment.staffId ? (await db.select().from(staff).where(eq(staff.id, appointment.staffId)))[0] : null
    await sendAppointmentEmail(appointment.email, appointment.name, person?.name ?? "nuestro equipo", appointment.appointmentDate, appointment.appointmentTime)
  }
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
