"use client"

import { useState } from "react"

export function AdminAccessForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")
    const response = await fetch("/api/admin/request-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
    const data = await response.json()
    setMessage(data.message)
    setLoading(false)
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-6"><form onSubmit={submit} className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8"><p className="text-xs uppercase tracking-[0.3em] text-primary">LUMA · Administración</p><h1 className="font-serif text-4xl text-foreground">Ingresá con tu email</h1><p className="text-sm leading-6 text-muted-foreground">Te enviaremos un enlace seguro para acceder al panel.</p><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" className="w-full rounded-md border border-input bg-background px-4 py-3 text-foreground" /><button disabled={loading} className="w-full rounded-full bg-primary px-5 py-3 text-xs tracking-[0.18em] text-primary-foreground disabled:opacity-60">{loading ? "ENVIANDO..." : "ENVIAR MAGIC LINK"}</button>{message && <p className="text-sm text-muted-foreground">{message}</p>}</form></main>
}
