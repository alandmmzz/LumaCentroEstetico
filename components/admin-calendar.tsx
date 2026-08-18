"use client"

import type { Appointment } from "@/lib/db/schema"
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
}: {
  appointments: Appointment[]
}) {
  const today = new Date()
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
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
    <div className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-border bg-card/60 p-6">
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

      <div className="rounded-xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-primary">
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
          <ul className="flex flex-col gap-3">
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
                    {a.service}
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
        )}
      </div>
    </div>
  )
}
