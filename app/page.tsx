import { About } from "@/components/about"
import { BookingSection } from "@/components/booking-section"
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { WhatsAppFloat } from "@/components/whatsapp-float"
import { getServiceCatalog } from "@/lib/db/services"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const dbCatalog = await getServiceCatalog()
  const catalog = dbCatalog.map((category) => ({
    name: category.name,
    description: category.description,
    treatments: category.treatments.map((treatment) => ({
      id: String(treatment.id),
      name: treatment.name,
      price: treatment.price,
      note: treatment.note,
    })),
  }))
  return (
    <main>
      <SiteHeader />
      <Hero />
      <About />
      <Services catalog={catalog} />
      <BookingSection />
      <SiteFooter />
      <WhatsAppFloat />
    </main>
  )
}
