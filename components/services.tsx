import { SERVICE_CATEGORIES, formatUYU } from "@/lib/services"
import Image from "next/image"

type PublicService = { name: string; description: string; treatments: readonly { id: string; name: string; price: number | null; promoPrice?: number | null; note?: string }[] }

const services: PublicService[] = SERVICE_CATEGORIES.map((category) => ({
  name: category.name,
  description: category.description,
  treatments: category.treatments,
}))

export function Services({ catalog = services }: { catalog?: PublicService[] } = {}) {
  return (
    <section id="servicios" className="bg-secondary/50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-primary">
            Lo que hacemos
          </p>
          <h2 className="font-serif text-4xl text-foreground md:text-5xl">
            Nuestros servicios
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
          <div className="grid gap-3 lg:min-h-full lg:grid-rows-3">
            <div className="relative min-h-64 overflow-hidden rounded-lg lg:min-h-0">
              <Image
                src="/services-luma.png"
                alt="Ambiente de tratamientos de belleza en LUMA"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative hidden min-h-64 overflow-hidden rounded-lg lg:block lg:min-h-0">
              <Image
                src="/services-pedicure.png"
                alt="Tratamiento de pedicuría en LUMA"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative hidden min-h-64 overflow-hidden rounded-lg lg:block lg:min-h-0">
              <Image
                src="/services-cosmetology.png"
                alt="Tratamiento de cosmetología en LUMA"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <ul className="divide-y divide-border">
            {catalog.map((service, i) => (
              <li
                key={service.name}
                className="flex items-start gap-5 py-6 first:pt-0"
              >
                <span className="font-serif text-lg text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-2xl text-foreground">
                    {service.name}
                  </h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2" aria-label={`Tratamientos de ${service.name}`}>
                    {service.treatments.map((treatment) => (
                      <span
                        key={treatment.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/70 px-3 py-1.5 text-xs text-foreground"
                      >
                        {treatment.name}
                        {treatment.price !== null && (treatment.promoPrice ?? null) !== null ? (
                          <span className="flex items-center gap-1.5"><span className="text-muted-foreground line-through">{formatUYU(treatment.price)}</span><span className="font-medium text-primary">{formatUYU(treatment.promoPrice!)}</span></span>
                        ) : treatment.price !== null ? (
                          <span className="text-primary">{formatUYU(treatment.price)}</span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
