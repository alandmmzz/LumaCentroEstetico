import { getAdminServiceCatalog, getAppointments, getServiceSchedules, getStaff } from "@/app/actions/appointments"
import { AdminAppointments } from "@/components/admin-appointments"
import { AdminServices } from "@/components/admin-services"
import { AdminStaff } from "@/components/admin-staff"
import { AdminTabs } from "@/components/admin-tabs"
import { AdminCalendar } from "@/components/admin-calendar"
import { AdminSchedules } from "@/components/admin-schedules"
import Link from "next/link"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { AdminAccessForm } from "@/components/admin-access-form"
import { getAdminEmails } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) return <AdminAccessForm />

  const [appointments, serviceCatalog, staffList, scheduleList] = await Promise.all([
    getAppointments(),
    getAdminServiceCatalog(),
    getStaff(),
    getServiceSchedules(),
  ])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
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

        <AdminTabs
          turnos={<div className="space-y-10"><AdminCalendar appointments={appointments} catalog={serviceCatalog} /><AdminAppointments appointments={appointments} staff={staffList} catalog={serviceCatalog} /></div>}
          servicios={<AdminServices catalog={serviceCatalog} />}
          personal={<AdminStaff staff={staffList} adminEmails={getAdminEmails()} />}
          horarios={<AdminSchedules schedules={scheduleList} />}
        />
      </div>
    </main>
  )
}
