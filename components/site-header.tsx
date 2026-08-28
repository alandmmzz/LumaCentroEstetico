"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isBookingPage = pathname === "/reservar"

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
        <Link href="/" className="block shrink-0" aria-label="LUMA Centro Estético, inicio">
          <Image src="/luma-logo.png" alt="LUMA Centro Estético" width={150} height={150} className="h-auto w-28 sm:w-36" priority />
        </Link>
        <nav className="hidden items-center gap-8 text-sm tracking-wide text-foreground md:flex">
          <Link href="/#nosotras" className="transition-colors hover:text-primary">
            Nosotras
          </Link>
          <Link href="/#servicios" className="transition-colors hover:text-primary">
            Servicios
          </Link>
          <Link href="/reservar" className="transition-colors hover:text-primary">
            Agendar
          </Link>
        </nav>
        <Link
          href={isBookingPage ? "/" : "/reservar"}
          className="rounded-full bg-primary px-5 py-2 text-xs tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          {isBookingPage ? "VOLVER AL INICIO" : "RESERVAR TURNO"}
        </Link>
      </div>
    </header>
  )
}
