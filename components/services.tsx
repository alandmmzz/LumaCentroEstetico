import Image from "next/image"

const services = [
  {
    name: "Nails",
    description:
      "Manicuría, esmaltado semipermanente y diseños que realzan tus manos.",
  },
  {
    name: "Pedicura",
    description:
      "Cuidado completo de tus pies con acabados prolijos y duraderos.",
  },
  {
    name: "Depilación",
    description:
      "Técnicas cuidadas para una piel suave, respetando cada zona.",
  },
  {
    name: "Masajes descontracturantes",
    description:
      "Aliviá tensiones y recuperá tu equilibrio con manos expertas.",
  },
  {
    name: "Cosmetología",
    description:
      "Tratamientos faciales que iluminan y renuevan tu piel.",
  },
]

export function Services() {
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

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image
              src="/services-luma.png"
              alt="Detalle de tratamiento de belleza en LUMA"
              fill
              className="object-cover"
            />
          </div>

          <ul className="divide-y divide-border">
            {services.map((service, i) => (
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
