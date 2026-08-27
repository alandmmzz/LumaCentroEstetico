import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { isAdminEmail, sendAdminMagicLink } from "@/lib/admin-auth"

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: "" }))
  const cleanEmail = String(email).toLowerCase().trim()
  const origin = `${(await headers()).get("x-forwarded-proto") ?? "https"}://${(await headers()).get("x-forwarded-host") ?? new URL(request.url).host}`
  if (await isAdminEmail(cleanEmail)) await sendAdminMagicLink(cleanEmail, origin)
  return NextResponse.json({ message: "Si el email está autorizado, recibirás un enlace en breve." })
}
