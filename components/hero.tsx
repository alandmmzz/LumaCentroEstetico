import Image from "next/image"

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-24 pt-24 sm:pb-32">
      <Image
        src="/hero-luma.png"
        alt="Ambiente cálido de LUMA Centro Estético con flores secas y luz natural"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/75" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="mb-6 text-xs uppercase tracking-[0.45em] text-secondary-foreground">
          Iluminamos tu belleza
        </p>
        <h1 className="text-balance font-serif text-5xl leading-tight text-foreground md:text-7xl">
          Los sueños empiezan{" "}
          <span className="italic text-accent-foreground">mucho antes</span> de
          abrir una puerta
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-pretty leading-relaxed text-foreground/90">
          Luma nació con un propósito muy simple: crear un espacio donde cada
          mujer pueda detenerse un momento, respirar y sentirse cuidada.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#agenda"
            className="rounded-full bg-primary px-8 py-3 text-sm tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            AGENDAR TURNO
          </a>
          <a
            href="#servicios"
            className="rounded-full border border-primary bg-background/80 px-8 py-3 text-sm tracking-[0.15em] text-primary backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            NUESTROS SERVICIOS
          </a>
        </div>
      </div>
    </section>
  )
}
