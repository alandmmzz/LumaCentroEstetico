// Precios de ejemplo en pesos uruguayos (UYU). Editá estos valores cuando tengas los precios reales.
export const SERVICES = [
  { name: "Nails", price: 1200 },
  { name: "Pedicura", price: 900 },
  { name: "Depilación", price: 800 },
  { name: "Masajes descontracturantes", price: 1500 },
  { name: "Cosmetología", price: 1800 },
] as const

export const SERVICE_NAMES = SERVICES.map((s) => s.name)

export function getServicePrice(name: string): number {
  return SERVICES.find((s) => s.name === name)?.price ?? 0
}

export const DEPOSIT_OPTIONS = [30, 50, 80, 100] as const

export function formatUYU(amount: number): string {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(amount)
}

// Datos de ejemplo para transferencia bancaria. Reemplazá por los datos reales de LUMA Centro Estético.
export const BANK_ACCOUNT = {
  bank: "Banco Itaú",
  accountHolder: "LUMA Centro Estético",
  accountType: "Caja de ahorro en pesos",
  accountNumber: "0001234567890",
  documentId: "RUT 21XXXXXXXXXX",
  alias: "luma.centroestetico",
  whatsapp: "099 123 456",
}
