"use client"

import { useRef, useState, useTransition } from "react"
import { Download } from "lucide-react"
import { getWeeklyAvailability } from "@/app/actions/appointments"
import type { ServiceCatalog } from "@/lib/db/services"

type Day = { date: string; label: string; times: string[] }

export function AdminStories({ catalog }: { catalog: ServiceCatalog }) {
  const [category, setCategory] = useState(catalog[0]?.name ?? "")
  const [days, setDays] = useState<Day[]>([])
  const [pending, startTransition] = useTransition()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function generate() {
    startTransition(async () => setDays(await getWeeklyAvailability(category)))
  }

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `horarios-${category.toLowerCase().replaceAll(" ", "-")}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"><div><p className="text-xs uppercase tracking-[0.35em] text-primary">Contenido para redes</p><h2 className="mt-2 font-serif text-4xl text-foreground">Story de horarios</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Generá una story minimalista con los próximos siete días laborables disponibles para un servicio.</p><div className="mt-8 flex flex-wrap items-end gap-3"><label className="grid gap-2 text-xs uppercase tracking-wider text-muted-foreground">Servicio<select value={category} onChange={(event) => { setCategory(event.target.value); setDays([]) }} className="min-w-56 rounded-md border border-input bg-card px-3 py-2 text-sm normal-case tracking-normal text-foreground">{catalog.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><button type="button" onClick={generate} disabled={pending || !category} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{pending ? "Generando…" : "Ver horarios"}</button></div></div><div className="flex flex-col items-center gap-4"><div className="w-full max-w-[270px] overflow-hidden rounded-lg border border-border bg-secondary shadow-sm"><canvas ref={canvasRef} width="1080" height="1920" className="block h-auto w-full" /><StoryCanvas canvas={canvasRef.current} category={category} days={days} /></div><button type="button" onClick={download} disabled={!days.length} className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm text-primary disabled:opacity-40"><Download data-icon="inline-start" />Descargar PNG</button></div></section>
}

function StoryCanvas({ canvas, category, days }: { canvas: HTMLCanvasElement | null; category: string; days: Day[] }) {
  if (canvas) {
    const context = canvas.getContext("2d")
    if (context) {
      context.fillStyle = "#f7f3ec"; context.fillRect(0, 0, 1080, 1920)
      context.fillStyle = "#9a7849"; context.font = "24px Arial"; context.fillText("LUMA CENTRO ESTÉTICO", 100, 150)
      context.fillStyle = "#2f2924"; context.font = "64px Georgia"; context.fillText("Horarios disponibles", 100, 280)
      context.font = "42px Georgia"; context.fillText(category, 100, 355)
      days.forEach((day, index) => { const y = 490 + index * 170; context.fillStyle = "#9a7849"; context.font = "28px Arial"; context.fillText(day.label, 100, y); context.fillStyle = "#2f2924"; context.font = "34px Arial"; context.fillText(day.times.length ? day.times.join("   ·   ") : "Sin horarios disponibles", 100, y + 60); context.strokeStyle = "#ded4c6"; context.beginPath(); context.moveTo(100, y + 95); context.lineTo(980, y + 95); context.stroke() })
      context.fillStyle = "#9a7849"; context.font = "26px Arial"; context.fillText("Reservas por WhatsApp", 100, 1760)
    }
  }
  return null
}

