"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-serif text-2xl font-semibold tracking-[0.25em] text-primary">
            LUMA
          </span>
          <span className="mt-1 text-[0.6rem] tracking-[0.4em] text-muted-foreground">
            CENTRO ESTÉTICO
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm tracking-wide text-foreground md:flex">
          <a href="#nosotras" className="transition-colors hover:text-primary">
            Nosotras
          </a>
          <a href="#servicios" className="transition-colors hover:text-primary">
            Servicios
          </a>
          <a href="#agenda" className="transition-colors hover:text-primary">
            Agendar
          </a>
        </nav>
        <a
          href="#agenda"
          className="rounded-full bg-primary px-5 py-2 text-xs tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          RESERVAR TURNO
        </a>
      </div>
    </header>
  )
}
