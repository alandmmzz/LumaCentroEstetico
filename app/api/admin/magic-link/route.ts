import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth"

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? undefined
  if (!verifyAdminToken(token)) return NextResponse.redirect(new URL("/admin?error=link-expired", request.url))
  ;(await cookies()).set(COOKIE_NAME, token!, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" })
  return NextResponse.redirect(new URL("/admin", request.url))
}
