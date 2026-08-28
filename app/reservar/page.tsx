import { BookingForm } from "@/components/booking-form"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WhatsAppFloat } from "@/components/whatsapp-float"
import { getServiceCatalog } from "@/lib/db/services"

export const dynamic = "force-dynamic"

export default async function BookingPage() {
  const catalog = await getServiceCatalog()

  return (
    <main className="min-h-screen bg-background pt-20">
      <SiteHeader />
      <section className="bg-background px-6 py-12 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.4em] text-primary">Reservá tu momento</p>
            <h1 className="text-balance font-serif text-4xl text-foreground md:text-5xl">Agendá tu turno</h1>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">Completá tus datos y elegí el día y horario que mejor te queden.</p>
          </div>
          <div className="rounded-xl border border-border bg-card/60 p-4 shadow-sm sm:p-8"><BookingForm catalog={catalog} /></div>
        </div>
      </section>
      <SiteFooter />
      <WhatsAppFloat />
    </main>
  )
}
