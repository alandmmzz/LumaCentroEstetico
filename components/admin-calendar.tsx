"use client"

import type { Appointment } from "@/lib/db/schema"
import type { ServiceCatalog } from "@/lib/db/services"
import { ChevronLeft, ChevronRight, CalendarDays, Columns3 } from "lucide-react"
import { useMemo, useState } from "react"

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const statusDot: Record<string, string> = {
  pendiente: "bg-accent-foreground",
  confirmado: "bg-primary",
  cancelado: "bg-destructive",
}

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatCatalogServiceLabel(value: string, catalog: ServiceCatalog) {
  try {
    const selected = JSON.parse(value) as { category?: string; treatmentIds?: string[] | number[] }
    const category = catalog.find((item) => item.name === selected.category)
    const names = category?.treatments.filter((treatment) => selected.treatmentIds?.some((id) => String(id) === String(treatment.id))).map((treatment) => treatment.name)
    return names?.length ? `${selected.category}: ${names.join(", ")}` : selected.category ?? value
  } catch {
    return value
  }
}

function getServiceCategory(value: string) {
  try { return JSON.parse(value).category ?? value } catch { return value }
}

function formatLong(key: string) {
  const d = new Date(`${key}T00:00:00`)
  return d.toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function AdminCalendar({
  appointments,
  catalog,
}: {
  appointments: Appointment[]
  catalog: ServiceCatalog
}) {
  const today = new Date()
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
  const [showGantt, setShowGantt] = useState(false)
  const [selected, setSelected] = useState<string | null>(
    toKey(today.getFullYear(), today.getMonth(), today.getDate()),
  )

  // Group non-cancelled appointments by date key.
  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      if (a.status === "cancelado") continue
      const list = map.get(a.appointmentDate) ?? []
      list.push(a)
      map.set(a.appointmentDate, list)
    }
    for (const list of map.values()) {
      list.sort((x, y) => x.appointmentTime.localeCompare(y.appointmentTime))
    }
    return map
  }, [appointments])

  const { year, month } = cursor
  // getDay(): 0=Sun..6=Sat -> shift so Monday is first column.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const next = new Date(c.year, c.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const selectedList = selected ? (byDate.get(selected) ?? []) : []

  return (
    <div className="mb-10 grid min-w-0 max-w-full gap-6 overflow-hidden lg:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card/60 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => shiftMonth(-1)}
              aria-label="Mes anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setCursor({
                  year: today.getFullYear(),
                  month: today.getMonth(),
                })
              }
              className="rounded-full border border-border px-3 text-xs tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Hoy
            </button>
            <button
              onClick={() => shiftMonth(1)}
              aria-label="Mes siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wider text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const key = toKey(year, month, day)
            const list = byDate.get(key) ?? []
            const isToday = key === todayKey
            const isSelected = key === selected
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : isToday
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-transparent text-foreground hover:border-border hover:bg-secondary/60"
                }`}
              >
                <span className="tabular-nums">{day}</span>
                {list.length > 0 && (
                  <span className="mt-1 flex gap-0.5">
                    {list.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected
                            ? "bg-primary-foreground"
                            : (statusDot[a.status] ?? statusDot.pendiente)
                        }`}
                      />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex min-w-0 items-center gap-2 text-primary">
          <CalendarDays className="h-4 w-4" />
          <button type="button" onClick={() => setShowGantt((value) => !value)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary lg:hidden" aria-label={showGantt ? "Mostrar listado" : "Mostrar vista Gantt"}><Columns3 className="h-3.5 w-3.5" />{showGantt ? "Lista" : "Gantt"}</button>
          <h3 className="text-xs uppercase tracking-[0.25em]">
            {selected ? formatLong(selected) : "Seleccioná un día"}
          </h3>
        </div>

        {selectedList.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No hay turnos para este día.
          </p>
        ) : (
          <div>
          <ul className={`${showGantt ? "hidden lg:flex" : "flex"} flex-col gap-3`}>

            {selectedList.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3"
              >
                <span className="font-serif text-lg text-primary tabular-nums">
                  {a.appointmentTime}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatCatalogServiceLabel(a.service, catalog)}
                  </p>
                </div>
                <span
                  className={`ml-auto h-2 w-2 shrink-0 rounded-full ${
                    statusDot[a.status] ?? statusDot.pendiente
                  }`}
                  title={a.status}
                />
              </li>
            ))}
          </ul>
          <div className={`${showGantt ? "block" : "hidden lg:block"} mt-4 overflow-x-auto rounded-lg border border-border bg-background/40 p-3`} aria-label="Vista Gantt del día">
            <div className="mb-2 grid min-w-[620px] grid-cols-[5rem_repeat(14,minmax(2.5rem,1fr))] text-[10px] text-muted-foreground">
              <span />{Array.from({ length: 14 }, (_, index) => <span key={index} className="border-l border-border pl-1">{String(index + 8).padStart(2, "0")}:00</span>)}
            </div>
            <div className="flex min-w-[620px] flex-col gap-2">
              {selectedList.map((a) => { const start = Number(a.appointmentTime.split(":")[0]) + Number(a.appointmentTime.split(":")[1]) / 60; const duration = getServiceCategory(a.service) === "Promos" ? 4 : 1.5; return <div key={a.id} className="grid grid-cols-[5rem_repeat(14,minmax(2.5rem,1fr))] items-center"><span className="truncate pr-2 text-xs text-foreground">{a.name}</span><span className={`col-span-14 h-7 rounded-md px-2 py-1 text-[10px] text-primary-foreground ${statusDot[a.status] === "bg-destructive" ? "bg-destructive" : "bg-primary"}`} style={{ gridColumn: `${Math.max(2, Math.floor(start - 8) + 2)} / span ${Math.max(1, Math.ceil(duration))}` }}>{a.appointmentTime} · {formatCatalogServiceLabel(a.service, catalog)}</span></div> })}
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  )
}
