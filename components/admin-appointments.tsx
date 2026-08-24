"use client"

import {
  deleteAppointment,
  markPaymentVerified,
  updateStatus,
} from "@/app/actions/appointments"
import type { Appointment } from "@/lib/db/schema"
import { formatUYU } from "@/lib/services"
import { useState, useTransition } from "react"

const paymentLabels: Record<string, string> = {
  pendiente: "Sin seña",
  pendiente_verificacion: "Verificar transf.",
  pagado: "Pagado",
  rejected: "Rechazado",
}

const paymentStyles: Record<string, string> = {
  pendiente: "bg-muted text-muted-foreground",
  pendiente_verificacion: "bg-accent text-accent-foreground",
  pagado: "bg-primary/15 text-primary",
  rejected: "bg-destructive/10 text-destructive",
}

const STATUS_OPTIONS = ["pendiente", "confirmado", "cancelado"]

const statusStyles: Record<string, string> = {
  pendiente: "bg-accent text-accent-foreground",
  confirmado: "bg-primary/15 text-primary",
  cancelado: "bg-destructive/10 text-destructive",
}

function formatDate(value: string) {
  const d = new Date(`${value}T00:00:00`)
  return d.toLocaleDateString("es-UY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function AdminAppointments({
  appointments,
}: {
  appointments: Appointment[]
}) {
  const [filter, setFilter] = useState("todos")
  const [isPending, startTransition] = useTransition()

  const filtered =
    filter === "todos"
      ? appointments
      : appointments.filter((a) => a.status === filter)

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {["todos", ...STATUS_OPTIONS].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs capitalize tracking-wide transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 py-16 text-center text-muted-foreground">
          No hay turnos para mostrar.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Hora</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.id} className="bg-card/40">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {a.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.phone}</td>
                  <td className="px-4 py-3 text-foreground">{a.service}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(a.appointmentDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.appointmentTime} hs
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs capitalize ${
                        statusStyles[a.status] ?? statusStyles.pendiente
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs ${
                        paymentStyles[a.paymentStatus] ?? paymentStyles.pendiente
                      }`}
                    >
                      {paymentLabels[a.paymentStatus] ?? a.paymentStatus}
                    </span>
                    {a.depositAmount > 0 && (
                      <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                        {formatUYU(a.depositAmount)} ({a.depositPercentage}%)
                        {a.paymentMethod ? ` · ${a.paymentMethod}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {a.paymentStatus === "pendiente_verificacion" && (
                        <button
                          onClick={() =>
                            startTransition(() => markPaymentVerified(a.id))
                          }
                          disabled={isPending}
                          className="rounded-md border border-primary/40 px-3 py-1 text-xs text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                        >
                          Confirmar pago
                        </button>
                      )}
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
