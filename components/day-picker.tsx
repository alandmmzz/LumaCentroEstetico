"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
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

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function DayPicker({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (dateKey: string) => void
}) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })

  const { year, month } = cursor
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())

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

  function isDisabled(day: number) {
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)
    const isSunday = date.getDay() === 0
    return date < today || isSunday
  }

  return (
    <div className="rounded-lg border border-border bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-serif text-lg text-foreground">
          {MONTHS[month]} {year}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mes anterior"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Mes siguiente"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
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
          const disabled = isDisabled(day)
          const isToday = key === todayKey
          const isSelected = key === selected
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(key)}
              className={`aspect-square rounded-md text-sm transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : disabled
                    ? "text-muted-foreground/40"
                    : isToday
                      ? "border border-primary/50 text-foreground hover:bg-secondary/60"
                      : "text-foreground hover:bg-secondary/60"
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
