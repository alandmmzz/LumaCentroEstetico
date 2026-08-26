"use client"

import { createManualAppointment } from "@/app/actions/appointments"
import { SERVICE_CATEGORIES, formatUYU } from "@/lib/services"
import { useState, useTransition } from "react"

export function AdminNewAppointment({ staff }: { staff: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0].name)
  const [treatments, setTreatments] = useState<string[]>([SERVICE_CATEGORIES[0].treatments[0].id])
  const [isPending, startTransition] = useTransition()
  const selectedCategory = SERVICE_CATEGORIES.find((item) => item.name === category) ?? SERVICE_CATEGORIES[0]
  const price = selectedCategory.treatments.filter((item) => treatments.includes(item.id)).reduce((sum, item) => sum + (item.price ?? 0), 0)

  function selectCategory(value: string) {
    const next = SERVICE_CATEGORIES.find((item) => item.name === value) ?? SERVICE_CATEGORIES[0]
    setCategory(next.name)
    setTreatments(next.treatments[0] ? [next.treatments[0].id] : [])
  }

  function submit(formData: FormData) {
    const service = JSON.stringify({ category, treatmentIds: treatments })
    startTransition(async () => {
      const result = await createManualAppointment({
        name: String(formData.get("name") ?? ""), phone: String(formData.get("phone") ?? ""), email: String(formData.get("email") ?? ""),
        service, date: String(formData.get("date") ?? ""), time: String(formData.get("time") ?? ""), price,
        staffId: Number(formData.get("staffId")) || null,
      })
      if (result.ok) setOpen(false)
    })
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-primary px-5 py-2 text-xs tracking-wide text-primary-foreground hover:opacity-90">+ NUEVO TURNO</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="new-appointment-title">
      <form action={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-primary">Carga manual</p><h2 id="new-appointment-title" className="mt-2 font-serif text-2xl text-foreground">Nuevo turno</h2></div><button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground">Cerrar</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-foreground">Nombre<input required name="name" className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2" /></label>
          <label className="text-sm text-foreground">Teléfono<input required name="phone" className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2" /></label>
          <label className="text-sm text-foreground sm:col-span-2">Email<input name="email" type="email" className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2" /></label>
          <label className="text-sm text-foreground">Fecha<input required name="date" type="date" className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2" /></label>
          <label className="text-sm text-foreground">Hora<input required name="time" type="time" className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2" /></label>
          <label className="text-sm text-foreground sm:col-span-2">Servicio<select value={category} onChange={(e) => selectCategory(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2">{SERVICE_CATEGORIES.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          <div className="sm:col-span-2"><p className="mb-2 text-sm text-foreground">Sub-servicios</p><div className="flex flex-wrap gap-2">{selectedCategory.treatments.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"><input type="checkbox" checked={treatments.includes(item.id)} onChange={() => setTreatments((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />{item.name}</label>)}</div></div>
          <label className="text-sm text-foreground">Profesional<select name="staffId" className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"><option value="">Sin asignar</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          <div className="flex items-end text-sm text-muted-foreground">Precio sugerido: <strong className="ml-1 text-primary">{formatUYU(price)}</strong></div>
        </div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-xs">Cancelar</button><button disabled={isPending || treatments.length === 0} className="rounded-full bg-primary px-5 py-2 text-xs text-primary-foreground disabled:opacity-50">{isPending ? "GUARDANDO..." : "GUARDAR TURNO"}</button></div>
      </form>
    </div>}
  </>
}
