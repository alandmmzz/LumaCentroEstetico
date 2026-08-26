import {
  getAppointmentById,
  isMercadoPagoAvailable,
} from "@/app/actions/appointments"
import { Checkout } from "@/components/checkout"
import { SiteHeader } from "@/components/site-header"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const appointmentId = Number(id)
  if (Number.isNaN(appointmentId)) notFound()

  const appointment = await getAppointmentById(appointmentId)
  if (!appointment) notFound()

  // Si ya está pago, mostramos un estado simple.
  if (appointment.paymentStatus === "pagado") {
    return (
      <main className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-40 text-center">
          <h1 className="font-serif text-4xl text-foreground">
            Este turno ya fue abonado
          </h1>
          <p className="mt-4 text-muted-foreground">
            Tu reserva está confirmada. ¡Te esperamos!
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-primary px-8 py-3 text-sm tracking-[0.15em] text-primary-foreground"
          >
            VOLVER AL INICIO
          </Link>
        </div>
      </main>
    )
  }

  const mercadoPagoEnabled = await isMercadoPagoAvailable()

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">
          Confirmá tu reserva
        </p>
        <h1 className="mt-3 text-balance font-serif text-4xl text-foreground md:text-5xl">
          Un último paso para asegurar tu turno
        </h1>
        <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Elegí cuánto querés abonar como seña y el medio de pago. Así dejamos tu
          lugar reservado.
        </p>

        <div className="mt-12">
          <Checkout
            appointment={{
              id: appointment.id,
              name: appointment.name,
              service: appointment.service,
              appointmentDate: appointment.appointmentDate,
              appointmentTime: appointment.appointmentTime,
              price: appointment.price,
            }}
            mercadoPagoEnabled={mercadoPagoEnabled}
          />
        </div>
      </div>
    </main>
  )
}
