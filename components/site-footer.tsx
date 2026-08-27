import { MessageCircle } from "lucide-react"
import { whatsappUrl } from "@/lib/schedule"

const INSTAGRAM_URL = "https://instagram.com/luma_centroestetico"

// lucide-react quitó los íconos de marcas (Instagram, etc.) en versiones recientes,
// así que usamos el mismo trazado que usan sus íconos como SVG inline.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40 py-14">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="flex flex-col items-center leading-none">
          <span className="font-serif text-2xl font-semibold tracking-[0.25em] text-primary">
            LUMA
          </span>
          <span className="mt-1 text-[0.6rem] tracking-[0.4em] text-muted-foreground">
            CENTRO ESTÉTICO
          </span>
        </div>
        <p className="mx-auto mt-6 max-w-md text-sm italic leading-relaxed text-muted-foreground">
          Iluminamos tu belleza, potenciamos tu esencia.
        </p>
        <p className="mt-6 text-xs tracking-wide text-muted-foreground">
          San Martín 2825 · Reducto · Montevideo, Uruguay
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Seguinos en Instagram"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer"
            aria-label="Escribinos por WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </a>
        </div>
        <p className="mt-3 text-xs tracking-wide text-muted-foreground">
          @luma_centroestetico
        </p>
      </div>
    </footer>
  )
}
