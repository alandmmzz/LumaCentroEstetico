"use client"

import { createAppointment, getBookedTimes } from "@/app/actions/appointments"
import { DayPicker } from "@/components/day-picker"
import { TIME_SLOTS } from "@/lib/time-slots"
import { useEffect, useRef, useState, useTransition } from "react"

const SERVICES = [
  "Nails",
  "Pedicura",
  "Depilación",
  "Masajes descontracturantes",
  "Cosmetología",
]

const inputClass =
  "w-full rounded-md border border-input bg-card px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"

function formatSelected(key: string) {
  const d = new Date(`${key}T00:00:00`)
  return d.toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function BookingForm() {
  const [isPending, startTransition] = useTransition()
  const [isLoadingTimes, setIsLoadingTimes] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!selectedDate) {
      setBookedTimes([])
      return
    }
    setIsLoadingTimes(true)
    setSelectedTime(null)
    getBookedTimes(selectedDate)
      .then(setBookedTimes)
      .finally(() => setIsLoadingTimes(false))
  }, [selectedDate])

  function handleSubmit(formData: FormData) {
    if (!selectedDate || !selectedTime) {
      setMessage({ ok: false, text: "Elegí un día y un horario disponible." })
      return
    }
    formData.set("appointmentDate", selectedDate)
    formData.set("appointmentTime", selectedTime)
    setMessage(null)
    startTransition(async () => {
      const result = await createAppointment(formData)
      if (result.ok) {
        setMessage({
          ok: true,
          text: "¡Tu turno fue solicitado! Te contactaremos para confirmarlo.",
        })
        formRef.current?.reset()
        setSelectedDate(null)
        setSelectedTime(null)
      } else {
        setMessage({ ok: false, text: result.error ?? "Ocurrió un error." })
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm text-foreground">
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Tu nombre"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm text-foreground">
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="Ej. 099 123 456"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="service" className="mb-2 block text-sm text-foreground">
          Servicio
        </label>
        <select id="service" name="service" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Elegí un servicio
          </option>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm text-foreground">Elegí el día</p>
        <DayPicker selected={selectedDate} onSelect={setSelectedDate} />
      </div>

      <div>
        <p className="mb-2 text-sm text-foreground">
          {selectedDate
            ? `Horarios disponibles · ${formatSelected(selectedDate)}`
            : "Horarios disponibles (09 a 20 hs)"}
        </p>
        {!selectedDate ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Seleccioná primero un día para ver los horarios.
          </p>
        ) : isLoadingTimes ? (
          <p className="rounded-md border border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Cargando horarios...
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {TIME_SLOTS.map((t) => {
              const isBooked = bookedTimes.includes(t)
              const isSelected = selectedTime === t
              return (
                <button
                  key={t}
                  type="button"
                  disabled={isBooked}
                  onClick={() => setSelectedTime(t)}
                  className={`rounded-md border px-2 py-2 text-xs tabular-nums transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : isBooked
                        ? "cursor-not-allowed border-border text-muted-foreground/40 line-through"
                        : "border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !selectedDate || !selectedTime}
        className="w-full rounded-full bg-primary px-8 py-3.5 text-sm tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "ENVIANDO..." : "SOLICITAR TURNO"}
      </button>

      {message && (
        <p
          role="status"
          className={`rounded-md px-4 py-3 text-center text-sm ${
            message.ok
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  )
}
