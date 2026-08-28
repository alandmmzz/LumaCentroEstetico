"use client"

import { type ReactNode, useState } from "react"

const tabs = ["turnos", "servicios", "personal", "horarios"] as const

export function AdminTabs({ turnos, servicios, personal, horarios }: { turnos: ReactNode; servicios: ReactNode; personal: ReactNode; horarios: ReactNode }) {
  const [active, setActive] = useState<(typeof tabs)[number]>("turnos")
  const content = { turnos, servicios, personal, horarios }[active]
  return <div>
    <div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Secciones de administración">
      {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={active === tab} onClick={() => setActive(tab)} className={`rounded-full px-5 py-2 text-sm capitalize transition-colors ${active === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{tab}</button>)}
    </div>
    {content}
  </div>
}
