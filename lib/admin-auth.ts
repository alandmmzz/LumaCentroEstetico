import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { staff } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

const COOKIE_NAME = "luma_admin_session"
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "alandmarp11@gmail.com,julietaandrioti5@gmail.com,roxipe9@gmail.com")
  .split(",")
  .map((email) => email.toLowerCase().trim())
  .filter(Boolean)

function signature(value: string) {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(value).digest("base64url")
}

export function getAdminEmails() {
  return ADMIN_EMAILS
}

export async function isAdminEmail(email: string) {
  const normalized = email.toLowerCase().trim()
  if (ADMIN_EMAILS.includes(normalized)) return true
  const [person] = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.email, normalized), eq(staff.adminAccess, true), eq(staff.active, true)))
  return Boolean(person)
}

export function createAdminToken(email: string, expiresAt: number) {
  const payload = `${email.toLowerCase().trim()}.${expiresAt}`
  return `${payload}.${signature(payload)}`
}

export async function verifyAdminToken(token: string | undefined) {
  if (!token) return false
  const parts = token.split(".")
  const provided = parts.pop()
  const expires = parts.pop()
  const email = parts.join(".")
  if (!email || !expires || !provided || !(await isAdminEmail(email)) || Number(expires) < Date.now()) return false
  const expected = signature(`${email}.${expires}`)
  return provided.length === expected.length && timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

export async function isAdminAuthenticated() {
  return verifyAdminToken((await cookies()).get(COOKIE_NAME)?.value)
}

export { COOKIE_NAME }

export function adminMagicLink(email: string) {
  const expiresAt = Date.now() + 30 * 60 * 1000
  return `/api/admin/magic-link?token=${encodeURIComponent(createAdminToken(email, expiresAt))}`
}

export async function sendAdminMagicLink(email: string, origin: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? "no-reply@luma.com.uy"
  if (!key) return false
  const link = `${origin}${adminMagicLink(email)}`
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: email, subject: "Acceso al panel de LUMA", html: `<p>Solicitaste acceder al panel de administración de LUMA.</p><p><a href="${link}">Ingresar al panel</a></p><p>Este enlace vence en 30 minutos y es de un solo uso recomendado.</p>` }),
  })
  if (!response.ok) {
    console.error("[v0] Admin magic link email rejected by Resend", { status: response.status })
  }
  return response.ok
}
