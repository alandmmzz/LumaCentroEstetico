"use client"

import type { Appointment } from "@/lib/db/schema"
import type { ServiceCatalog } from "@/lib/db/services"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
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
    const selected = JSON.parse(value) as { category?: string; treatmentIds?: (string | number)[] }
    const category = catalog.find((item) => item.name === selected.category)
    const normalize = (input: string | number) => String(input).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const names = category?.treatments.filter((treatment) => selected.treatmentIds?.some((id) => String(id) === String(treatment.id) || normalize(id) === normalize(treatment.name))).map((treatment) => treatment.name)
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
            <div className="mb-2 grid min-w-[620px] grid-cols-[5rem_1fr] text-[10px] text-muted-foreground">
              <span />
              <div className="grid grid-cols-14">
                {Array.from({ length: 14 }, (_, index) => <span key={index} className="border-l border-border pl-1">{String(index + 8).padStart(2, "0")}:00</span>)}
              </div>
            </div>
            <div className="flex min-w-[620px] flex-col gap-2">
              {selectedList.map((a) => {
                const [hours, minutes] = a.appointmentTime.split(":").map(Number)
                const start = hours + (minutes || 0) / 60
                const duration = (catalog.find((item) => item.name === getServiceCategory(a.service))?.durationMinutes ?? 90) / 60
                const totalHours = 14
                const left = Math.min(100, Math.max(0, ((start - 8) / totalHours) * 100))
                const width = Math.min(100 - left, Math.max(4, (duration / totalHours) * 100))
                return (
                  <div key={a.id} className="grid min-h-10 grid-cols-[5rem_1fr] items-center">
                    <span className="truncate pr-2 text-xs text-foreground">{a.name}</span>
                    <div className="relative h-9">
                      <span className={`absolute top-0 flex h-9 items-center truncate rounded-md px-2 text-[10px] leading-tight text-primary-foreground ${statusDot[a.status] === "bg-destructive" ? "bg-destructive" : "bg-primary"}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${a.appointmentTime} · ${getServiceCategory(a.service)}`}>
                        {a.appointmentTime} · {getServiceCategory(a.service)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-5 flex justify-center border-t border-border/70 pt-4 lg:hidden">
            <div className="inline-flex rounded-full border border-border bg-background/60 p-1" role="group" aria-label="Modo de agenda">
              <button type="button" onClick={() => setShowGantt(false)} aria-pressed={!showGantt} className={`rounded-full px-4 py-2 text-xs transition-colors ${!showGantt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Modo lista</button>
              <button type="button" onClick={() => setShowGantt(true)} aria-pressed={showGantt} className={`rounded-full px-4 py-2 text-xs transition-colors ${showGantt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Modo Gantt</button>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  )
}
