"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Share2 } from "lucide-react"
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

  async function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const filename = `horarios-${category.toLowerCase().replaceAll(" ", "-")}.png`
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
    if (!blob) return
    const file = new File([blob], filename, { type: "image/png" })
    if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Horarios disponibles de Luma" })
      return
    }
    const link = document.createElement("a")
    link.download = filename
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"><div><p className="text-xs uppercase tracking-[0.35em] text-primary">Contenido para redes</p><h2 className="mt-2 font-serif text-4xl text-foreground">Story de horarios</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Generá una story minimalista con los próximos seis días laborables disponibles para un servicio.</p><div className="mt-8 flex flex-wrap items-end gap-3"><label className="grid gap-2 text-xs uppercase tracking-wider text-muted-foreground">Servicio<select value={category} onChange={(event) => { setCategory(event.target.value); setDays([]) }} className="min-w-56 rounded-md border border-input bg-card px-3 py-2 text-sm normal-case tracking-normal text-foreground">{catalog.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><button type="button" onClick={generate} disabled={pending || !category} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{pending ? "Generando…" : "Ver horarios"}</button></div></div><div className="flex flex-col items-center gap-4"><div className="w-full max-w-[270px] overflow-hidden rounded-lg border border-border bg-secondary shadow-sm"><canvas ref={canvasRef} width="1080" height="1920" className="block h-auto w-full" /><StoryCanvas canvas={canvasRef.current} category={category} days={days} /></div><button type="button" onClick={download} disabled={!days.length} className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm text-primary disabled:opacity-40"><Share2 data-icon="inline-start" />Guardar en galería</button></div></section>
}

function StoryCanvas({ canvas, category, days }: { canvas: HTMLCanvasElement | null; category: string; days: Day[] }) {
  useEffect(() => {
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    const background = new Image()
    const logo = new Image()
    background.crossOrigin = "anonymous"
    logo.crossOrigin = "anonymous"
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
      context.globalAlpha = 0.34
      context.filter = "blur(10px) saturate(0.5)"
      context.drawImage(background, -24, -24, 1128, 1968)
      context.filter = "none"
      context.globalAlpha = 0.34
      context.fillStyle = ivory
      context.fillRect(0, 0, 1080, 1920)
      context.globalAlpha = 1
      context.fillStyle = blush
      context.beginPath(); context.ellipse(45, 280, 280, 390, -0.25, 0, Math.PI * 2); context.fill()
      context.fillStyle = sand
      context.beginPath(); context.ellipse(1050, 1650, 330, 420, 0.2, 0, Math.PI * 2); context.fill()
      if (logo.complete && logo.naturalWidth > 0) {
        context.save()
        context.globalAlpha = 1
        context.globalCompositeOperation = "source-over"
        context.filter = "none"
        context.drawImage(logo, (1080 - 250) / 2, 72, 250, 78)
        context.restore()
      }
      context.save()
      context.strokeStyle = ink
      context.lineWidth = 6
      context.beginPath(); context.roundRect(72, 195, 58, 52, 9); context.stroke()
      context.beginPath(); context.moveTo(72, 213); context.lineTo(130, 213); context.stroke()
      context.beginPath(); context.moveTo(88, 185); context.lineTo(88, 207); context.moveTo(114, 185); context.lineTo(114, 207); context.stroke()
      context.restore()
      context.fillStyle = ink; context.font = "500 98px Cormorant Garamond, serif"; context.fillText("HORARIOS", 150, 260)
      context.fillStyle = rose; context.font = "italic 88px 'Brush Script MT', cursive"; context.letterSpacing = "1px"; context.fillText("disponibles", 82, 350)
      context.fillStyle = ink; context.font = "600 27px Jost, sans-serif"; context.letterSpacing = "7px"; context.fillText(category.toUpperCase(), 88, 420)
      days.forEach((day, index) => {
        const y = 495 + index * 194
        context.fillStyle = mist
        context.strokeStyle = blush
        context.lineWidth = 3
        context.beginPath(); context.roundRect(48, y, 984, 166, 26); context.fill(); context.stroke()
        const weekday = day.label.split(" ")[0].slice(0, 3).toUpperCase()
        const dateNumber = day.label.match(/\d+/)?.[0] ?? ""
        context.fillStyle = rose; context.font = "700 46px Jost, sans-serif"; context.letterSpacing = "4px"; context.fillText(`${weekday} ${dateNumber}`, 88, y + 92)
        context.fillStyle = ink; context.font = "500 38px Cormorant Garamond, serif"
        const timeRows = day.times.length ? [day.times.slice(0, 3), day.times.slice(3)] : [["Sin disponibilidad"]]
        timeRows.filter((row) => row.length).forEach((row, rowIndex) => context.fillText(row.join("    ·    "), 390, y + 76 + rowIndex * 48))
      })
      context.fillStyle = blush; context.fillRect(80, 1718, 920, 3)
      context.fillStyle = rose; context.font = "italic 64px 'Brush Script MT', cursive"; context.letterSpacing = "0px"; context.fillText("Tu momento", 80, 1785)
      context.fillText("empieza acá.", 250, 1850)
      context.fillStyle = ink; context.font = "600 24px Jost, sans-serif"; context.letterSpacing = "4px"; context.fillText("RESERVÁ ONLINE", 610, 1850)
    }
    background.onload = render
    logo.onload = render
    background.src = "/hero-luma.png"
    logo.src = "/luma-logo.png"
    if (background.complete || logo.complete) render()
    return () => { background.onload = null; logo.onload = null }
  }, [canvas, category, days])
  return null
}

