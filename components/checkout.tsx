"use client"

import {
  confirmBankTransfer,
  createMercadoPagoCheckout,
} from "@/app/actions/appointments"
import {
  BANK_ACCOUNT,
  DEPOSIT_OPTIONS,
  formatUYU,
} from "@/lib/services"
import { Building2, Check, Copy, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

type Appointment = {
  id: number
  name: string
  service: string
  appointmentDate: string
  appointmentTime: string
  price: number
}

function formatDate(key: string) {
  const d = new Date(`${key}T00:00:00`)
  return d.toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm text-foreground">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        aria-label={`Copiar ${label}`}
      >
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  )
}

export function Checkout({
  appointment,
  mercadoPagoEnabled,
}: {
  appointment: Appointment
  mercadoPagoEnabled: boolean
}) {
  const [percentage, setPercentage] = useState<number>(DEPOSIT_OPTIONS[0])
  const [method, setMethod] = useState<"transferencia" | "mercadopago">(
    "transferencia",
  )
  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const depositAmount = Math.round((appointment.price * percentage) / 100)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      if (method === "transferencia") {
        const res = await confirmBankTransfer(appointment.id, percentage)
        if (res.ok) setConfirmed(true)
        else setError(res.error ?? "Ocurrió un error.")
      } else {
        const res = await createMercadoPagoCheckout(appointment.id, percentage)
        if (res.ok) {
          window.location.href = res.initPoint
        } else {
          setError(res.error)
        }
      }
    })
  }

  if (confirmed) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-2xl text-foreground">
          ¡Reserva registrada!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Realizá la transferencia de{" "}
          <span className="text-foreground">{formatUYU(depositAmount)}</span> con
          los datos indicados y envianos el comprobante por WhatsApp al{" "}
          <span className="text-foreground">{BANK_ACCOUNT.whatsapp}</span>.
          Confirmaremos tu turno una vez recibido el pago.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-sm tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          VOLVER AL INICIO
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {/* Seña */}
        <section>
          <h2 className="mb-1 font-serif text-2xl text-foreground">
            Elegí tu seña
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Reservá tu turno abonando una parte del total. El resto lo pagás en
            el salón.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DEPOSIT_OPTIONS.map((opt) => {
              const amount = Math.round((appointment.price * opt) / 100)
              const active = percentage === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPercentage(opt)}
                  className={`rounded-lg border p-4 text-center transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span
                    className={`block text-2xl font-light tabular-nums ${active ? "text-primary" : "text-foreground"}`}
                  >
                    {opt}%
                  </span>
                  <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                    {formatUYU(amount)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Método de pago */}
        <section>
          <h2 className="mb-4 font-serif text-2xl text-foreground">
            Método de pago
          </h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setMethod("transferencia")}
              className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                method === "transferencia"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Building2 className="h-5 w-5 shrink-0 text-primary" />
              <span className="flex-1">
                <span className="block text-sm text-foreground">
                  Transferencia bancaria
                </span>
                <span className="block text-xs text-muted-foreground">
                  Te mostramos los datos de la cuenta
                </span>
              </span>
              <span
                className={`h-4 w-4 shrink-0 rounded-full border ${method === "transferencia" ? "border-primary bg-primary" : "border-border"}`}
              />
            </button>

            <button
              type="button"
              onClick={() => mercadoPagoEnabled && setMethod("mercadopago")}
              disabled={!mercadoPagoEnabled}
              className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                method === "mercadopago"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${!mercadoPagoEnabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <CreditCard className="h-5 w-5 shrink-0 text-primary" />
              <span className="flex-1">
                <span className="block text-sm text-foreground">
                  Mercado Pago
                </span>
                <span className="block text-xs text-muted-foreground">
                  {mercadoPagoEnabled
                    ? "Tarjeta de crédito, débito o dinero en cuenta"
                    : "No disponible por el momento"}
                </span>
              </span>
              <span
                className={`h-4 w-4 shrink-0 rounded-full border ${method === "mercadopago" ? "border-primary bg-primary" : "border-border"}`}
              />
            </button>
          </div>

          {method === "transferencia" && (
            <div className="mt-4 rounded-lg border border-border bg-card p-5">
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                Datos para la transferencia
              </p>
              <CopyRow label="Banco" value={BANK_ACCOUNT.bank} />
              <CopyRow label="Titular" value={BANK_ACCOUNT.accountHolder} />
              <CopyRow label="Tipo de cuenta" value={BANK_ACCOUNT.accountType} />
              <CopyRow label="Número de cuenta" value={BANK_ACCOUNT.accountNumber} />
              <CopyRow label="Documento" value={BANK_ACCOUNT.documentId} />
              <CopyRow label="Alias" value={BANK_ACCOUNT.alias} />
            </div>
          )}
        </section>
      </div>

      {/* Resumen */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-serif text-xl text-foreground">
            Resumen del turno
          </h3>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">A nombre de</dt>
              <dd className="text-right text-foreground">{appointment.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Servicio</dt>
              <dd className="text-right text-foreground">{appointment.service}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Fecha</dt>
              <dd className="text-right capitalize text-foreground">
                {formatDate(appointment.appointmentDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Hora</dt>
              <dd className="text-right tabular-nums text-foreground">
                {appointment.appointmentTime}
              </dd>
            </div>
          </dl>

          <div className="my-4 border-t border-border" />

          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Precio del servicio</dt>
              <dd className="tabular-nums text-foreground">
                {formatUYU(appointment.price)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Seña ({percentage}%)</dt>
              <dd className="tabular-nums text-foreground">
                {formatUYU(depositAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Resta pagar en el salón</dt>
              <dd className="tabular-nums text-muted-foreground">
                {formatUYU(appointment.price - depositAmount)}
              </dd>
            </div>
          </dl>

          <div className="my-4 border-t border-border" />

          <div className="flex items-baseline justify-between">
            <span className="text-sm text-foreground">A pagar ahora</span>
            <span className="font-serif text-2xl tabular-nums text-primary">
              {formatUYU(depositAmount)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {method === "mercadopago" ? "PAGAR CON MERCADO PAGO" : "CONFIRMAR RESERVA"}
          </button>

          {error && (
            <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
              {error}
            </p>
          )}

          <Link
            href="/#agenda"
            className="mt-3 block text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Cancelar y volver
          </Link>
        </div>
      </aside>
    </div>
  )
}
