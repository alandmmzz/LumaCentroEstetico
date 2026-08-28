"use client"

import { updateServiceSchedules } from "@/app/actions/appointments"
import { ONLINE_CATEGORIES } from "@/lib/schedule"
import { useState, useTransition } from "react"

export function AdminSchedules({ schedules }: { schedules: Array<{ serviceCategory: string; startTime: string }> }) {
  const [values, setValues] = useState<Record<string, string[]>>(() => Object.fromEntries(ONLINE_CATEGORIES.map((category) => [category, schedules.filter((item) => item.serviceCategory === category).map((item) => item.startTime)])))
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState("")
  function save(category: string) { startTransition(async () => { await updateServiceSchedules(category, values[category] ?? []); setMessage("Horarios actualizados") }) }
  function add(category: string) { setValues((current) => ({ ...current, [category]: [...(current[category] ?? []), "09:00"] })) }
  return <section aria-labelledby="gestionar-horarios"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.3em] text-primary">Agenda configurable</p><h2 id="gestionar-horarios" className="mt-2 font-serif text-4xl text-foreground">Horarios por servicio</h2></div>{message && <p role="status" className="text-sm text-primary">{message}</p>}</div><div className="grid gap-5 md:grid-cols-3">{ONLINE_CATEGORIES.map((category) => <article key={category} className="rounded-xl border border-border bg-card p-5"><h3 className="font-serif text-2xl text-foreground">{category}</h3><div className="mt-5 flex flex-col gap-3">{(values[category] ?? []).map((time, index) => <div key={`${category}-${index}`} className="flex items-center gap-2"><input type="time" value={time} onChange={(event) => setValues((current) => ({ ...current, [category]: current[category].map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" /><button type="button" onClick={() => setValues((current) => ({ ...current, [category]: current[category].filter((_, itemIndex) => itemIndex !== index) }))} className="text-sm text-muted-foreground hover:text-destructive" aria-label={`Eliminar horario ${time}`}>Eliminar</button></div>)}</div><div className="mt-5 flex gap-2"><button type="button" onClick={() => add(category)} className="rounded-full border border-primary/40 px-4 py-2 text-sm text-primary">Agregar horario</button><button type="button" onClick={() => save(category)} disabled={pending} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Guardar</button></div></article>)}</div></section>
}
