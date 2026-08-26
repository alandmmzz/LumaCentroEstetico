"use client"

import { createStaff } from "@/app/actions/appointments"
import type { Staff } from "@/lib/db/schema"
import { useState, useTransition } from "react"

export function AdminStaff({ staff }: { staff: Staff[] }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  function submit() { startTransition(async () => { const result = await createStaff(name, email); setMessage(result.ok ? "Personal agregado. Recargá para verlo." : result.error ?? "No se pudo guardar."); if (result.ok) { setName(""); setEmail("") } }) }
  return <section aria-labelledby="personal-admin"><p className="text-xs uppercase tracking-[0.3em] text-primary">Equipo</p><h2 id="personal-admin" className="mt-2 font-serif text-4xl text-foreground">Personal</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{staff.map((person) => <div key={person.id} className="rounded-xl border border-border bg-card p-5"><p className="font-serif text-xl text-foreground">{person.name}</p><p className="mt-1 text-sm text-muted-foreground">{person.email ?? "Email pendiente"}</p></div>)}</div><div className="mt-8 flex flex-wrap gap-3"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" className="rounded-md border border-input bg-card px-3 py-2 text-sm" /><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email opcional" type="email" className="rounded-md border border-input bg-card px-3 py-2 text-sm" /><button type="button" onClick={submit} disabled={isPending} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Agregar personal</button></div>{message && <p className="mt-3 text-sm text-primary" role="status">{message}</p>}</section>
}
