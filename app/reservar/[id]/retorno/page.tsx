import { confirmMercadoPagoReturn } from "@/app/actions/appointments"
import { SiteHeader } from "@/components/site-header"
import Link from "next/link"

export default async function RetornoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment_id?: string; status?: string }>
}) {
  const { id } = await params
  const { payment_id, status } = await searchParams

  let approved = false
  if (payment_id) {
    const result = await confirmMercadoPagoReturn(Number(id), payment_id)
    approved = result.ok
  } else if (status === "approved") {
    approved = true
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-40 text-center">
        {approved ? (
          <>
            <h1 className="font-serif text-4xl text-foreground">
              ¡Pago confirmado!
            </h1>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Tu seña fue recibida y tu turno quedó confirmado. Te esperamos en
              LUMA Centro Estético.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-4xl text-foreground">
              Estamos procesando tu pago
            </h1>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Si el pago fue aprobado, tu turno se confirmará en breve. Ante
              cualquier duda, escribinos por WhatsApp.
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-primary px-8 py-3 text-sm tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          VOLVER AL INICIO
        </Link>
      </div>
    </main>
  )
}
