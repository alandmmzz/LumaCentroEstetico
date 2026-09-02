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
      const ivory = "#f7f3ec"
      const ink = "#302a26"
      const gold = "#a98452"
      const sand = "#e8ddcf"
      const mist = "#efe8df"
      context.clearRect(0, 0, 1080, 1920)
      context.fillStyle = ivory
      context.fillRect(0, 0, 1080, 1920)
      context.fillStyle = sand
      context.fillRect(0, 0, 1080, 18)
      context.fillStyle = gold
      context.beginPath(); context.arc(930, 130, 92, 0, Math.PI * 2); context.fill()
      context.fillStyle = ivory
      context.beginPath(); context.arc(930, 130, 62, 0, Math.PI * 2); context.fill()
      context.fillStyle = gold; context.font = "26px Arial"; context.letterSpacing = "5px"; context.fillText("LUMA", 92, 130)
      context.fillStyle = ink; context.font = "italic 84px Georgia"; context.fillText("Agenda", 88, 270)
      context.font = "30px Arial"; context.letterSpacing = "8px"; context.fillText("DE LA SEMANA", 95, 325)
      context.fillStyle = gold; context.font = "bold 38px Arial"; context.letterSpacing = "5px"; context.fillText(category.toUpperCase(), 95, 410)
      context.fillStyle = ink; context.font = "24px Arial"; context.letterSpacing = "2px"; context.fillText("HORARIOS DISPONIBLES", 95, 455)
      days.forEach((day, index) => {
        const y = 530 + index * 182
        context.fillStyle = mist
        context.beginPath(); context.roundRect(78, y, 924, 142, 18); context.fill()
        context.fillStyle = gold; context.font = "bold 24px Arial"; context.letterSpacing = "2px"; context.fillText(day.label.split(" ")[0].toUpperCase(), 112, y + 42)
        context.fillStyle = ink; context.font = "52px Georgia"; context.fillText(day.label.match(/\\d+/)?.[0] ?? "", 110, y + 103)
        context.fillStyle = gold; context.font = "bold 22px Arial"; context.letterSpacing = "1px"; context.fillText("TURNOS", 360, y + 42)
        context.fillStyle = ink; context.font = "30px Arial"; context.fillText(day.times.length ? day.times.join("   ·   ") : "Sin disponibilidad", 360, y + 94)
      })
      context.fillStyle = sand; context.fillRect(78, 1742, 924, 2)
      context.fillStyle = gold; context.font = "25px Arial"; context.letterSpacing = "3px"; context.fillText("RESERVAS POR WHATSAPP", 78, 1810)
      context.fillStyle = ink; context.font = "italic 30px Georgia"; context.letterSpacing = "0px"; context.fillText("Tu momento empieza acá.", 78, 1860)
      context.fillStyle = gold; context.font = "22px Arial"; context.fillText("@LUMA.CENTROESTETICO", 78, 1905)
    }
  }
  return null
}

