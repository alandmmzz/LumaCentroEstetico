"use client"

import { createTreatment, updateServiceCategory, updateTreatmentPrice } from "@/app/actions/appointments"
import type { ServiceCategory } from "@/lib/db/services"
import { Plus, Save } from "lucide-react"
import { useState, useTransition } from "react"

export function AdminServices({ catalog }: { catalog: Awaited<ReturnType<typeof import("@/lib/db/services").getAllServiceCatalog>> }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")
  const [newNames, setNewNames] = useState<Record<number, string>>({})
  const [newPrices, setNewPrices] = useState<Record<number, string>>({})
  const [prices, setPrices] = useState<Record<number, string>>(() => Object.fromEntries(catalog.flatMap((c) => c.treatments.map((t) => [t.id, t.price === null ? "" : String(t.price)]))))
  const [categories, setCategories] = useState(catalog)

  function savePrice(id: number) {
    const value = prices[id] === "" ? null : Number(prices[id])
    startTransition(async () => { await updateTreatmentPrice(id, value); setMessage("Precio actualizado") })
  }
  function addTreatment(categoryId: number) {
    const name = newNames[categoryId] ?? ""
    const price = newPrices[categoryId] === "" ? null : Number(newPrices[categoryId])
    startTransition(async () => { const result = await createTreatment(categoryId, name, price); if (result.ok) { setMessage("Tratamiento agregado"); setNewNames({ ...newNames, [categoryId]: "" }); setNewPrices({ ...newPrices, [categoryId]: "" }) } })
  }
  return <section aria-labelledby="gestionar-servicios">
    <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.3em] text-primary">Catálogo editable</p><h2 id="gestionar-servicios" className="mt-2 font-serif text-4xl text-foreground">Servicios y precios</h2></div>{message && <p className="text-sm text-primary" role="status">{message}</p>}</div>
    <div className="grid gap-5 md:grid-cols-2">
      {categories.map((category) => <article key={category.id} className="rounded-xl border border-border bg-card p-5"><h3 className="font-serif text-2xl text-foreground">{category.name}</h3><div className="mt-4 space-y-3">{category.treatments.map((treatment) => <div key={treatment.id} className="flex items-center gap-3"><label className="min-w-0 flex-1 text-sm text-foreground">{treatment.name}</label><input aria-label={`Precio de ${treatment.name}`} type="number" min="0" value={prices[treatment.id] ?? ""} onChange={(e) => setPrices({ ...prices, [treatment.id]: e.target.value })} placeholder="Consultar" className="w-28 rounded-md border border-input bg-background px-3 py-2 text-right text-sm" /><button type="button" onClick={() => savePrice(treatment.id)} disabled={isPending} className="rounded-md border border-primary/40 p-2 text-primary hover:bg-primary/10" aria-label={`Guardar precio de ${treatment.name}`}><Save className="h-4 w-4" /></button></div>)}</div><div className="mt-5 flex gap-2 border-t border-border pt-4"><input aria-label={`Nuevo tratamiento para ${category.name}`} value={newNames[category.id] ?? ""} onChange={(e) => setNewNames({ ...newNames, [category.id]: e.target.value })} placeholder="Nuevo tratamiento" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" /><input aria-label={`Precio nuevo para ${category.name}`} type="number" value={newPrices[category.id] ?? ""} onChange={(e) => setNewPrices({ ...newPrices, [category.id]: e.target.value })} placeholder="$" className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm" /><button type="button" onClick={() => addTreatment(category.id)} disabled={isPending} className="rounded-md bg-primary p-2 text-primary-foreground" aria-label={`Agregar tratamiento a ${category.name}`}><Plus className="h-4 w-4" /></button></div></article>)}
    </div>
  </section>
}
