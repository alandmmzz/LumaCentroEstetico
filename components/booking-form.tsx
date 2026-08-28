"use client"

import { createAppointment, getAvailableSchedule, getBookedTimes } from "@/app/actions/appointments"
import { DayPicker } from "@/components/day-picker"
import { DEPOSIT_ENABLED, SERVICE_CATEGORIES, formatUYU } from "@/lib/services"
import { getScheduleForCategory, isOnlineCategory, whatsappUrl } from "@/lib/schedule"
import { Check, ChevronDown, Footprints, Hand, HeartPulse, Sparkles, Flower2, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

const inputClass = "w-full rounded-md border border-input bg-card px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
const icons = { Nails: Hand, "Cosmetología": Sparkles, Masajes: HeartPulse, Pedicuría: Footprints, "Depilación": Flower2, Promos: Sparkles }

function formatSelected(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long" })
}

export function BookingForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoadingTimes, setIsLoadingTimes] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([])
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [availableSchedule, setAvailableSchedule] = useState<string[]>([])
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!selectedDate) { setBookedTimes([]); return }
    setIsLoadingTimes(true)
    setSelectedTime(null)
    if (!selectedCategory || !isOnlineCategory(selectedCategory)) {
      setBookedTimes([])
      setIsLoadingTimes(false)
      return
    }
    Promise.all([getBookedTimes(selectedDate, selectedCategory), getAvailableSchedule(selectedCategory)]).then(([booked, schedule]) => { setBookedTimes(booked); setAvailableSchedule(schedule) }).finally(() => setIsLoadingTimes(false))
  }, [selectedDate, selectedCategory])

  const category = SERVICE_CATEGORIES.find((item) => item.name === selectedCategory)
  const servicePrice = category?.treatments.filter((item) => selectedTreatments.includes(item.id)).reduce((sum, item) => sum + (item.price ?? 0), 0) ?? 0

  function chooseCategory(name: string) {
    setSelectedCategory(name)
    setSelectedTreatments([])
  }

  function toggleTreatment(id: string) {
    setSelectedTreatments((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function handleSubmit(formData: FormData) {
    if (!selectedDate || !selectedTime || !selectedCategory || selectedTreatments.length === 0) {
      setMessage({ ok: false, text: "Elegí una categoría y al menos un tratamiento, además del día y horario." })
      return
    }
    formData.set("service", JSON.stringify({ category: selectedCategory, treatmentIds: selectedTreatments }))
    formData.set("appointmentDate", selectedDate)
    formData.set("appointmentTime", selectedTime)
    setMessage(null)
    startTransition(async () => {
      const result = await createAppointment(formData)
      if (result.ok && result.id) {
        if (DEPOSIT_ENABLED) router.push(`/reservar/${result.id}`)
        else setConfirmed(true)
      } else {
        setMessage({ ok: false, text: result.error ?? "Ocurrió un error." })
      }
    })
  }

  if (confirmed) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-2xl text-foreground">¡Reserva enviada!</h2>
        <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Recibimos tu solicitud de turno. Nos pondremos en contacto para confirmarla.
        </p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm text-foreground">Nombre completo</label>
        <input id="name" name="name" type="text" required placeholder="Tu nombre" className={inputClass} />
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-foreground">Email para confirmar tu turno</label>
        <input id="email" name="email" type="email" placeholder="tu@email.com" className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className="mb-2 block text-sm text-foreground">Teléfono</label>
        <input id="phone" name="phone" type="tel" required placeholder="Ej. 099 123 456" className={inputClass} />
      </div>
      <fieldset>
        <legend className="mb-3 text-sm text-foreground">Elegí una categoría</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICE_CATEGORIES.map((item) => {
            const Icon = icons[item.name as keyof typeof icons]
            const active = selectedCategory === item.name
            return (
              <div key={item.name}>
                <button type="button" role="radio" aria-checked={active} onClick={() => chooseCategory(item.name)} className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}>
                  <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="flex-1"><span className="flex flex-wrap items-center gap-2 font-serif text-lg text-foreground">{item.name}{item.name === "Promos" && <span className="rounded-full bg-primary px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-primary-foreground">4 hs · combinadas</span>}</span><span className="block text-xs text-muted-foreground">{item.description}</span></span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{active && <Check className="h-3 w-3" aria-hidden="true" />}</span>
                </button>
                {active && <div className="mt-2 rounded-lg border border-primary/25 bg-background/70 p-3" role="group" aria-label={`Tratamientos de ${item.name}`}><div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-primary"><ChevronDown className="h-3.5 w-3.5" /> Elegí uno o más tratamientos</div><div className="space-y-2">{item.treatments.map((treatment) => { const checked = selectedTreatments.includes(treatment.id); return <label key={treatment.id} className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-primary/5"><input type="checkbox" checked={checked} onChange={() => toggleTreatment(treatment.id)} className="sr-only" /><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{checked && <Check className="h-3 w-3" aria-hidden="true" />}</span><span className="flex-1 text-sm text-foreground">{treatment.name}{treatment.note && <span className="mt-0.5 block text-xs text-muted-foreground">{treatment.note}</span>}</span><span className="text-sm tabular-nums text-primary">{treatment.price === null ? "Consultar" : formatUYU(treatment.price)}</span></label> })}</div></div>}
              </div>
            )
          })}
        </div>
        <input type="hidden" name="service" value={selectedCategory ?? ""} />
        {servicePrice > 0 && <p className="mt-3 text-sm text-muted-foreground">Total estimado: <span className="text-foreground">{formatUYU(servicePrice)}</span></p>}
      </fieldset>
      {selectedCategory && !isOnlineCategory(selectedCategory) ? (
        <a href={whatsappUrl(`Hola, quisiera consultar horarios para ${selectedCategory}.`)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm tracking-wide text-primary-foreground transition-opacity hover:opacity-90">
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> CONSULTAR POR HORARIOS A WHATSAPP · +598 95 206 278
        </a>
      ) : (
        <>
          <div><p className="mb-2 text-sm text-foreground">Elegí el día</p><DayPicker selected={selectedDate} onSelect={setSelectedDate} /></div>
          <div><p className="mb-2 text-sm text-foreground">{selectedDate ? `Horarios disponibles · ${formatSelected(selectedDate)}` : "Horarios disponibles"}</p>{!selectedDate ? <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Seleccioná primero un día para ver los horarios.</p> : isLoadingTimes ? <p className="rounded-md border border-border px-4 py-6 text-center text-sm text-muted-foreground">Cargando horarios...</p> : <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{(availableSchedule.length ? availableSchedule : getScheduleForCategory(selectedCategory ?? "")).map((time) => { const booked = bookedTimes.includes(time); const active = selectedTime === time; return <button key={time} type="button" disabled={booked} onClick={() => setSelectedTime(time)} className={`rounded-md border px-2 py-2 text-xs tabular-nums transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : booked ? "cursor-not-allowed border-border text-muted-foreground/40 line-through" : "border-border text-foreground hover:border-primary hover:text-primary"}`}>{time}</button> })}</div>}</div>
          <button type="submit" disabled={isPending || !selectedDate || !selectedTime || !selectedCategory || selectedTreatments.length === 0} className="w-full rounded-full bg-primary px-8 py-3.5 text-sm tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">{isPending ? "PROCESANDO..." : DEPOSIT_ENABLED ? "CONTINUAR A LA SEÑA" : "CONTINUAR"}</button>
        </>
      )}
      {message && <p role="status" className={`rounded-md px-4 py-3 text-center text-sm ${message.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{message.text}</p>}
    </form>
  )
}
