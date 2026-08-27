"use client"

import { createStaff, updateStaffAdminAccess } from "@/app/actions/appointments"
import type { Staff } from "@/lib/db/schema"
import { useState, useTransition } from "react"

export function AdminStaff({ staff, adminEmails = [] }: { staff: Staff[]; adminEmails?: string[] }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [adminAccess, setAdminAccess] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  function submit() { startTransition(async () => { const result = await createStaff(name, email, adminAccess); setMessage(result.ok ? "Personal agregado. Recargá para verlo." : result.error ?? "No se pudo guardar."); if (result.ok) { setName(""); setEmail(""); setAdminAccess(false) } }) }
  function toggleAdmin(id: number, enabled: boolean) { startTransition(async () => { const result = await updateStaffAdminAccess(id, enabled); setMessage(result.ok ? "Permiso actualizado." : result.error ?? "No se pudo actualizar.") }) }
  const emailForPerson = (person: Staff) => {
    if (person.email) return person.email
    const normalizedName = person.name.toLowerCase()
    if (normalizedName.includes("julieta")) return adminEmails.find((email) => email.includes("julieta"))
    if (normalizedName.includes("roxana") || normalizedName.includes("roxana pérez")) return adminEmails.find((email) => email.includes("roxi"))
    return undefined
  }
  return <section aria-labelledby="personal-admin"><p className="text-xs uppercase tracking-[0.3em] text-primary">Equipo</p><h2 id="personal-admin" className="mt-2 font-serif text-4xl text-foreground">Personal</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{staff.map((person) => <div key={person.id} className="rounded-xl border border-border bg-card p-5"><p className="font-serif text-xl text-foreground">{person.name}</p><p className="mt-1 text-sm text-muted-foreground">{emailForPerson(person) ?? "Email pendiente"}</p><label className="mt-4 flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={person.adminAccess || adminEmails.includes(person.email?.toLowerCase().trim() ?? "")} onChange={(event) => toggleAdmin(person.id, event.target.checked)} disabled={!person.email || isPending} />Acceso admin</label></div>)}</div><div className="mt-8"><button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Agregar personal</button></div>{message && <p className="mt-3 text-sm text-primary" role="status">{message}</p>}{isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsModalOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="add-staff-title" className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Equipo</p><h3 id="add-staff-title" className="mt-2 font-serif text-3xl text-foreground">Agregar personal</h3></div><button type="button" onClick={() => setIsModalOpen(false)} aria-label="Cerrar" className="text-2xl text-muted-foreground">×</button></div><div className="mt-6 flex flex-col gap-4"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" className="rounded-md border border-input bg-card px-3 py-3 text-sm" /><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email opcional" type="email" className="rounded-md border border-input bg-card px-3 py-3 text-sm" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={adminAccess} onChange={(event) => setAdminAccess(event.target.checked)} disabled={!email} />Acceso admin</label><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-primary/40 px-5 py-2 text-sm text-primary">Cancelar</button><button type="button" onClick={() => { submit(); setIsModalOpen(false) }} disabled={isPending} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Guardar</button></div></div></section></div>}</section>
}
