import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function BookingSection() {
  return (
    <section id="agenda" className="bg-background py-16 md:py-24">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-primary">
            Reservá tu momento
          </p>
          <h2 className="text-balance font-serif text-4xl text-foreground md:text-5xl">
            Agendá tu turno
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
            Completá tus datos y elegí el día y horario que mejor te queden. Nos
            pondremos en contacto para confirmar tu cita y recibirte como te
            merecés.
          </p>
          <div className="mt-8 space-y-3 text-sm text-foreground">
            <p className="flex items-center gap-3">
              <span className="text-primary">·</span> San Martín 2825, Reducto,
              Montevideo
            </p>
            <p className="flex items-center gap-3">
              <span className="text-primary">·</span> Lunes a sábado · 09 a 20 hs
            </p>
          </div>
        </div>
        <Link href="/reservar" className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3 text-sm tracking-[0.12em] text-primary-foreground transition-transform hover:scale-[1.02]">
          RESERVÁ TU MOMENTO <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
