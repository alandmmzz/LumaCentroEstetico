import "server-only"

function getAccessToken(): string | null {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || null
}

export function isMercadoPagoEnabled(): boolean {
  return getAccessToken() !== null
}

function getSiteUrl(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.V0_RUNTIME_URL) {
    return process.env.V0_RUNTIME_URL
  }
  return "http://localhost:3000"
}

export async function createMercadoPagoPreference(params: {
  appointmentId: number
  title: string
  amount: number
}): Promise<{ ok: true; initPoint: string; preferenceId: string } | { ok: false; error: string }> {
  const token = getAccessToken()
  if (!token) {
    return { ok: false, error: "Mercado Pago no está configurado." }
  }

  const siteUrl = getSiteUrl()
  const returnUrl = `${siteUrl}/reservar/${params.appointmentId}/retorno`

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: params.title,
          quantity: 1,
          unit_price: params.amount,
          currency_id: "UYU",
        },
      ],
      external_reference: String(params.appointmentId),
      back_urls: {
        success: returnUrl,
        pending: returnUrl,
        failure: returnUrl,
      },
      auto_return: "approved",
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.log("[v0] Mercado Pago preference error:", res.status, text)
    return { ok: false, error: "No se pudo generar el link de pago." }
  }

  const data = await res.json()
  return { ok: true, initPoint: data.init_point, preferenceId: data.id }
}

export async function getMercadoPagoPayment(
  paymentId: string,
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const token = getAccessToken()
  if (!token) {
    return { ok: false, error: "Mercado Pago no está configurado." }
  }

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    return { ok: false, error: "No se pudo verificar el pago." }
  }

  const data = await res.json()
  return { ok: true, status: data.status }
}
