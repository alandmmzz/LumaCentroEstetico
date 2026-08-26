export type OnlineCategory = "Nails" | "Pedicuría" | "Cosmetología"

export const ONLINE_CATEGORIES: OnlineCategory[] = ["Nails", "Pedicuría", "Cosmetología"]

export const CATEGORY_SCHEDULES: Record<OnlineCategory, string[]> = {
  Nails: ["09:00", "13:00", "16:00", "19:00"],
  Pedicuría: ["09:00", "13:00", "16:00", "19:00"],
  Cosmetología: ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"],
}

export const WHATSAPP_NUMBER = "59895206278"
export const WHATSAPP_DISPLAY = "+598 95 206 278"

export function getScheduleForCategory(category: string): string[] {
  return CATEGORY_SCHEDULES[category as OnlineCategory] ?? []
}

export function isOnlineCategory(category: string): category is OnlineCategory {
  return ONLINE_CATEGORIES.includes(category as OnlineCategory)
}

export function whatsappUrl(message = "Hola, quisiera consultar por horarios.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
