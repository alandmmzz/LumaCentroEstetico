export type Treatment = {
  id: string
  name: string
  price: number | null
  note?: string
}

export type ServiceCategory = {
  name: string
  description: string
  treatments: readonly Treatment[]
}

export const SERVICE_CATEGORIES = [
  {
    name: "Nails",
    description: "Manos cuidadas y diseños duraderos",
    treatments: [
      { id: "esmal­tado-semipermanente", name: "Esmaltado semipermanente", price: 590 },
      { id: "kapping-gel", name: "Kapping gel", price: 790 },
      { id: "mantenimiento-kapping", name: "Mantenimiento kapping", price: 690 },
      { id: "nivelacion-rubber", name: "Nivelación rubber", price: 690 },
      { id: "softgel", name: "Softgel", price: 990 },
      { id: "mantenimiento-softgel", name: "Mantenimiento softgel", price: 790 },
      { id: "remocion-ajena", name: "Remoción de retiros ajenos", price: 200 },
      { id: "remocion-luma", name: "Remoción de LUMA", price: 150 },
    ],
  },
  {
    name: "Cosmetología",
    description: "Rituales para iluminar y renovar tu piel",
    treatments: [
      { id: "spa-facial", name: "Spa facial", price: 800 },
      { id: "limpieza-profunda", name: "Limpieza profunda", price: 1290 },
    ],
  },
  {
    name: "Masajes",
    description: "Pausas de bienestar para tu cuerpo",
    treatments: [
      { id: "descontracturante", name: "Descontracturante", price: 790, note: "Cuello, espalda y cabeza · 40 min" },
      { id: "relajante", name: "Relajante", price: 890, note: "Espalda, cuello, brazos y piernas · 50 min" },
      { id: "piedras-calientes", name: "Piedras calientes (gemoterapia)", price: 990, note: "Espalda, piernas, brazos y pies · 60 min" },
    ],
  },
  {
    name: "Pedicuría",
    description: "Estética e hidratación para tus pies",
    treatments: [
      { id: "estetica-pies", name: "Estética de pies", price: 890, note: "Incluye hidratación, eliminación de callos y esmaltado semipermanente" },
    ],
  },
  {
    name: "Depilación",
    description: "Sistema español · Consultar promociones",
    treatments: [{ id: "depilacion-consulta", name: "Depilación · consultar precio", price: null }],
  },
] as const satisfies readonly ServiceCategory[]

export const SERVICES = SERVICE_CATEGORIES.map((category) => ({
  name: category.name,
  price: category.treatments.reduce((total, treatment) => total + (treatment.price ?? 0), 0),
}))

export const SERVICE_NAMES = SERVICE_CATEGORIES.map((category) => category.name)
export const DEPOSIT_OPTIONS = [30, 50, 80, 100] as const

export function getServicePrice(service: string): number {
  try {
    const selected = JSON.parse(service) as { category?: string; treatmentIds?: string[] }
    const category = SERVICE_CATEGORIES.find((item) => item.name === selected.category)
    return category?.treatments
      .filter((treatment) => selected.treatmentIds?.includes(treatment.id))
      .reduce((total, treatment) => total + (treatment.price ?? 0), 0) ?? 0
  } catch {
    return SERVICES.find((item) => item.name === service)?.price ?? 0
  }
}

export function formatServiceLabel(service: string): string {
  try {
    const selected = JSON.parse(service) as { category?: string; treatmentIds?: string[] }
    const category = SERVICE_CATEGORIES.find((item) => item.name === selected.category)
    const names = category?.treatments
      .filter((treatment) => selected.treatmentIds?.includes(treatment.id))
      .map((treatment) => treatment.name)
    return names?.length ? `${selected.category}: ${names.join(", ")}` : service
  } catch {
    return service
  }
}

export function formatUYU(amount: number): string {
  return new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 }).format(amount)
}

export const BANK_ACCOUNT = {
  bank: "Banco Itaú",
  accountHolder: "LUMA Centro Estético",
  accountType: "Caja de ahorro en pesos",
  accountNumber: "0001234567890",
  documentId: "RUT 21XXXXXXXXXX",
  alias: "luma.centroestetico",
  whatsapp: "099 123 456",
}

export const MERCADO_PAGO_PUBLIC_TOKEN = ""
