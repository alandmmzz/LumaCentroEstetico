import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "luma_admin_session"
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "alandmarp11@gmail.com").toLowerCase().trim()

function signature(value: string) {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(value).digest("base64url")
}

export function isAdminEmail(email: string) {
  return email.toLowerCase().trim() === ADMIN_EMAIL
}

export function createAdminToken(email: string, expiresAt: number) {
  const payload = `${email.toLowerCase().trim()}.${expiresAt}`
  return `${payload}.${signature(payload)}`
}

export function verifyAdminToken(token: string | undefined) {
  if (!token) return false
  const [email, expires, provided] = token.split(".")
  if (!email || !expires || !provided || !isAdminEmail(email) || Number(expires) < Date.now()) return false
  const expected = signature(`${email}.${expires}`)
  return provided.length === expected.length && timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

export async function isAdminAuthenticated() {
  return verifyAdminToken((await cookies()).get(COOKIE_NAME)?.value)
}

export { COOKIE_NAME }

export function adminMagicLink(email: string) {
  const expiresAt = Date.now() + 15 * 60 * 1000
  return `/api/admin/magic-link?token=${encodeURIComponent(createAdminToken(email, expiresAt))}`
}

export async function sendAdminMagicLink(email: string, origin: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) return false
  const link = `${origin}${adminMagicLink(email)}`
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: email, subject: "Acceso al panel de LUMA", html: `<p>Solicitaste acceder al panel de administración de LUMA.</p><p><a href="${link}">Ingresar al panel</a></p><p>Este enlace vence en 15 minutos y es de un solo uso recomendado.</p>` }),
  })
  return response.ok
}
