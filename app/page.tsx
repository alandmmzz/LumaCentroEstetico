import { About } from "@/components/about"
import { BookingSection } from "@/components/booking-section"
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <About />
      <Services />
      <BookingSection />
      <SiteFooter />
    </main>
  )
}
