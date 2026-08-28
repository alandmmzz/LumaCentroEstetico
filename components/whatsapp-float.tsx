import { MessageCircle } from "lucide-react"
import { WHATSAPP_DISPLAY, whatsappUrl } from "@/lib/schedule"

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label={`Escribinos por WhatsApp al ${WHATSAPP_DISPLAY}`}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">WhatsApp</span>
    </a>
  )
}
