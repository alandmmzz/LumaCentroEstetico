"use client"

import { useEffect, useRef, useState, useTransition } from "react"
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

  return <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"><div><p className="text-xs uppercase tracking-[0.35em] text-primary">Contenido para redes</p><h2 className="mt-2 font-serif text-4xl text-foreground">Story de horarios</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Generá una story minimalista con los próximos seis días laborables disponibles para un servicio.</p><div className="mt-8 flex flex-wrap items-end gap-3"><label className="grid gap-2 text-xs uppercase tracking-wider text-muted-foreground">Servicio<select value={category} onChange={(event) => { setCategory(event.target.value); setDays([]) }} className="min-w-56 rounded-md border border-input bg-card px-3 py-2 text-sm normal-case tracking-normal text-foreground">{catalog.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><button type="button" onClick={generate} disabled={pending || !category} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{pending ? "Generando…" : "Ver horarios"}</button></div></div><div className="flex flex-col items-center gap-4"><div className="w-full max-w-[270px] overflow-hidden rounded-lg border border-border bg-secondary shadow-sm"><canvas ref={canvasRef} width="1080" height="1920" className="block h-auto w-full" /><StoryCanvas canvas={canvasRef.current} category={category} days={days} /></div><button type="button" onClick={download} disabled={!days.length} className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm text-primary disabled:opacity-40"><Download data-icon="inline-start" />Descargar PNG</button></div></section>
}

function StoryCanvas({ canvas, category, days }: { canvas: HTMLCanvasElement | null; category: string; days: Day[] }) {
  useEffect(() => {
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    const background = new Image()
    background.crossOrigin = "anonymous"
    const render = () => {
      const ivory = "#f5eee3"
      const ink = "#332c24"
      const rose = "#a88752"
      const blush = "#ddcfb8"
      const sand = "#e5d8c3"
      const mist = "#fbf7f0"
      context.clearRect(0, 0, 1080, 1920)
      context.fillStyle = ivory
      context.fillRect(0, 0, 1080, 1920)
      context.globalAlpha = 0.2
      context.filter = "blur(10px) saturate(0.5)"
      context.drawImage(background, -24, -24, 1128, 1968)
      context.filter = "none"
      context.globalAlpha = 0.42
      context.fillStyle = ivory
      context.fillRect(0, 0, 1080, 1920)
      context.globalAlpha = 1
      context.fillStyle = blush
      context.beginPath(); context.ellipse(45, 280, 280, 390, -0.25, 0, Math.PI * 2); context.fill()
      context.fillStyle = sand
      context.beginPath(); context.ellipse(1050, 1650, 330, 420, 0.2, 0, Math.PI * 2); context.fill()
      context.fillStyle = rose; context.font = "600 26px Jost, sans-serif"; context.letterSpacing = "6px"; context.fillText("LUMA", 92, 130)
      context.fillStyle = ink; context.font = "500 92px Cormorant Garamond, serif"; context.fillText("HORARIOS", 82, 275)
      context.fillStyle = rose; context.font = "italic 92px 'Brush Script MT', cursive"; context.letterSpacing = "1px"; context.fillText("disponibles", 92, 365)
      context.fillStyle = ink; context.font = "600 28px Jost, sans-serif"; context.letterSpacing = "6px"; context.fillText(category.toUpperCase(), 98, 435)
      days.forEach((day, index) => {
        const y = 495 + index * 194
        context.fillStyle = mist
        context.strokeStyle = blush
        context.lineWidth = 3
        context.beginPath(); context.roundRect(64, y, 952, 166, 26); context.fill(); context.stroke()
        const weekday = day.label.split(" ")[0].slice(0, 3).toUpperCase()
        context.fillStyle = rose; context.font = "700 48px Jost, sans-serif"; context.letterSpacing = "5px"; context.fillText(weekday, 105, y + 62)
        context.fillStyle = ink; context.font = "500 82px Cormorant Garamond, serif"; context.fillText(day.label.match(/\d+/)?.[0] ?? "", 102, y + 138)
        context.fillStyle = rose; context.font = "700 26px Jost, sans-serif"; context.letterSpacing = "3px"; context.fillText("DISPONIBLE", 390, y + 55)
        context.fillStyle = ink; context.font = "500 40px Cormorant Garamond, serif"; context.fillText(day.times.length ? day.times.join("   ·   ") : "Sin disponibilidad", 390, y + 112)
      })
      context.fillStyle = blush; context.fillRect(80, 1718, 920, 3)
      context.fillStyle = rose; context.font = "italic 58px 'Brush Script MT', cursive"; context.letterSpacing = "0px"; context.fillText("Tu momento", 80, 1795)
      context.fillText("empieza acá.", 225, 1860)
      context.fillStyle = ink; context.font = "600 22px Jost, sans-serif"; context.letterSpacing = "4px"; context.fillText("RESERVÁ ONLINE", 80, 1900)
    }
    background.onload = render
    background.src = "/hero-luma.png"
    if (background.complete) render()
    return () => { background.onload = null }
  }, [canvas, category, days])
  return null
}

