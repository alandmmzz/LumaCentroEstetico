import { getAdminServiceCatalog, getAppointments, getStaff } from "@/app/actions/appointments"
import { AdminAppointments } from "@/components/admin-appointments"
import { AdminServices } from "@/components/admin-services"
import { AdminStaff } from "@/components/admin-staff"
import { AdminTabs } from "@/components/admin-tabs"
import { AdminCalendar } from "@/components/admin-calendar"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [appointments, serviceCatalog, staffList] = await Promise.all([
    getAppointments(),
    getAdminServiceCatalog(),
    getStaff(),
  ])

  const pendientes = appointments.filter((a) => a.status === "pendiente").length
  const confirmados = appointments.filter(
    (a) => a.status === "confirmado",
  ).length

  const stats = [
    { label: "Total de turnos", value: appointments.length },
    { label: "Pendientes", value: pendientes },
    { label: "Confirmados", value: confirmados },
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary">
              Panel de administración
            </p>
            <h1 className="mt-2 font-serif text-4xl text-foreground">
              Turnos de LUMA
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-primary/40 px-5 py-2 text-xs tracking-[0.15em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            VOLVER AL SITIO
          </Link>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card/60 p-6"
            >
              <p className="text-4xl font-light text-primary tabular-nums">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <AdminTabs
          turnos={<div className="space-y-10"><AdminCalendar appointments={appointments} /><AdminAppointments appointments={appointments} staff={staffList} /></div>}
          servicios={<AdminServices catalog={serviceCatalog} />}
          personal={<AdminStaff staff={staffList} />}
        />
      </div>
    </main>
  )
}
