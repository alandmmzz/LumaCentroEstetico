"use client"

import { type ReactNode, useState } from "react"

const tabs = ["turnos", "servicios", "personal", "horarios", "stories"] as const

export function AdminTabs({ turnos, servicios, personal, horarios, stories }: { turnos: ReactNode; servicios: ReactNode; personal: ReactNode; horarios: ReactNode; stories: ReactNode }) {
  const [active, setActive] = useState<(typeof tabs)[number]>("turnos")
  const content = { turnos, servicios, personal, horarios, stories }[active]
  return <div>
    <div className="sticky top-0 z-20 mb-8 -mx-1 flex max-w-full gap-2 overflow-x-auto border-b border-border bg-background/95 px-1 pb-3 pt-2 backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Secciones de administración">
      {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={active === tab} onClick={() => setActive(tab)} className={`rounded-full px-5 py-2 text-sm capitalize transition-colors ${active === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{tab}</button>)}
    </div>
    {content}
  </div>
}
