import { BookingForm } from "./booking-form"
import type { ServiceCatalog } from "@/lib/db/services"

export function BookingSection({ catalog }: { catalog?: ServiceCatalog }) {
  return (
    <section id="agenda" className="bg-background py-12 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-24 lg:self-start">
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

        <div className="rounded-xl border border-border bg-card/60 p-4 shadow-sm sm:p-8">
          <BookingForm catalog={catalog} />
        </div>
      </div>
    </section>
  )
}
