"use client"

import {
  deleteAppointment,
  assignStaff,
  updatePaymentManual,
  updateStatus,
} from "@/app/actions/appointments"
import { AdminNewAppointment } from "@/components/admin-new-appointment"
import type { Appointment, Staff } from "@/lib/db/schema"
import { SERVICE_CATEGORIES, formatServiceLabel, formatUYU } from "@/lib/services"
import { useState, useTransition } from "react"

const STATUS_OPTIONS = ["pendiente", "confirmado", "pago", "cancelado"]

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  pago: "Pago",
  cancelado: "Cancelado",
}

const statusStyles: Record<string, string> = {
  pendiente: "bg-accent text-accent-foreground",
  confirmado: "bg-primary/15 text-primary",
  pago: "bg-primary text-primary-foreground",
  cancelado: "bg-destructive/10 text-destructive",
}

function formatDate(value: string) {
  const d = new Date(`${value}T00:00:00`)
  return d.toLocaleDateString("es-UY", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
}

function getServiceCategory(value: string) {
  try {
    return JSON.parse(value).category ?? value
  } catch {
    return value
  }
}

function formatDateShort(value: string) {
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year.slice(-2)}`
}

export function AdminAppointments({
  appointments,
  staff,
}: {
  appointments: Appointment[]
  staff: Staff[]
}) {
  const [filter, setFilter] = useState("todos")
  const [serviceFilter, setServiceFilter] = useState("todos")
  const [staffFilter, setStaffFilter] = useState("todos")
  const [month, setMonth] = useState("")
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, number>>(
    () => Object.fromEntries(appointments.map((appointment) => [appointment.id, appointment.paymentReceived || appointment.price])),
  )
  const [isPending, startTransition] = useTransition()

  const filtered = appointments.filter((a) =>
    (filter === "todos" || a.status === filter) &&
    (serviceFilter === "todos" || getServiceCategory(a.service) === serviceFilter) &&
    (staffFilter === "todos" || String(a.staffId ?? "") === staffFilter) &&
    (!month || a.appointmentDate.startsWith(month))
  )

  const monthlyIncome = filtered.reduce((total, appointment) => total + (appointment.status === "pago" ? (paymentAmounts[appointment.id] ?? appointment.paymentReceived ?? appointment.price) : 0), 0)

  function downloadSummary() {
    const rows = [["Cliente", "Fecha", "Hora", "Servicio", "Profesional", "Pago recibido"], ...filtered.map((a) => [a.name, formatDateShort(a.appointmentDate), a.appointmentTime, formatServiceLabel(a.service), staff.find((p) => p.id === a.staffId)?.name ?? "Sin asignar", String(paymentAmounts[a.id] ?? a.price)])]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `resumen-ingresos-${month || "todos"}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-foreground">Turnos agendados</h2>
        <AdminNewAppointment staff={staff} />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="month-filter">Mes</label>
        <input id="month-filter" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground" />
        <button type="button" onClick={downloadSummary} className="rounded-full border border-primary/40 px-4 py-2 text-xs text-primary hover:bg-primary/10">DESCARGAR CSV</button>
        <span className="text-sm text-muted-foreground">Ingresos: <strong className="text-foreground">{formatUYU(monthlyIncome)}</strong></span>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="status-filter">Filtrar por estado</label>
        <select id="status-filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground">
          <option value="todos">Todos los estados</option>
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </select>
        <label className="sr-only" htmlFor="service-filter">Filtrar por servicio</label>
        <select id="service-filter" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground">
          <option value="todos">Todos los servicios</option>
          {SERVICE_CATEGORIES.slice(0, 5).map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="staff-filter">Filtrar por profesional</label>
        <select id="staff-filter" value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground">
          <option value="todos">Todo el personal</option>
          <option value="">Sin asignar</option>
          {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 py-16 text-center text-muted-foreground">
          No hay turnos para mostrar.
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto rounded-xl border border-border">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Fecha y hora</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Profesional</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.id} className="bg-card/40">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div>{a.name}</div>
                    <div className="mt-1 text-xs font-normal text-muted-foreground">{a.phone}</div>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-foreground"><div>{formatServiceLabel(a.service)}</div><div className="mt-1 text-xs tabular-nums text-primary">Sugerido: {formatUYU(a.price)}</div></td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{formatDateShort(a.appointmentDate)}</div>
                    <div className="mt-1 text-xs">{a.appointmentTime} hs</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs capitalize ${
                        statusStyles[a.status] ?? statusStyles.pendiente
                      }`}
                    >
{statusLabels[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.staffId ?? ""}
                      onChange={(event) =>
                        startTransition(() => assignStaff(a.id, event.target.value ? Number(event.target.value) : null))
                      }
                      disabled={isPending}
                      className="rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground"
                      aria-label={`Profesional para ${a.name}`}
                    >
                      <option value="">Sin asignar</option>
                      {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={paymentAmounts[a.id] ?? a.price}
                      onChange={(event) => {
                        const amount = Math.max(0, Number(event.target.value) || 0)
                        setPaymentAmounts((current) => ({ ...current, [a.id]: amount }))
                      }}
                      onBlur={() => {
                        const amount = paymentAmounts[a.id] ?? a.price
                        startTransition(() => updatePaymentManual(a.id, amount, a.status === "pago" ? "pagado" : "pendiente"))
                      }}
                      className="w-28 rounded-md border border-input bg-card px-2 py-1 text-xs tabular-nums text-foreground"
                      aria-label={`Monto a cobrar de ${a.name}`}
                      title="Podés ajustar por propina u otros cargos"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={a.status}
                        disabled={isPending}
                        onChange={(e) =>
                          startTransition(() =>
                            updateStatus(a.id, e.target.value),
                          )
                        }
                        className="rounded-md border border-input bg-card px-2 py-1 text-xs capitalize text-foreground outline-none focus:border-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          startTransition(() => deleteAppointment(a.id))
                        }
                        disabled={isPending}
                        className="rounded-md border border-destructive/30 px-3 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
