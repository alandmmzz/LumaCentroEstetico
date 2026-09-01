export type OnlineCategory = "Nails" | "Pedicuría" | "Cosmetología" | "Promos"

export const ONLINE_CATEGORIES: OnlineCategory[] = ["Nails", "Pedicuría", "Cosmetología", "Promos"]

export const CATEGORY_SCHEDULES: Record<OnlineCategory, string[]> = {
  Nails: ["09:00", "13:00", "16:00", "19:00"],
  Pedicuría: ["09:00", "13:00", "16:00", "19:00"],
  Cosmetología: ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"],
  Promos: ["09:00", "11:30", "14:00", "16:30"],
}

export const WHATSAPP_NUMBER = "59895206278"
export const WHATSAPP_DISPLAY = "+598 95 206 278"

export function getScheduleForCategory(category: string): string[] {
  return CATEGORY_SCHEDULES[category as OnlineCategory] ?? []
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA
}

export function isTimeAvailable(category: string, time: string, booked: Array<{ category: string; time: string; durationMinutes: number }>, durationMinutes: number) {
  const start = toMinutes(time)
  const end = start + durationMinutes
  const sameCategoryOverlaps = booked.some((item) => item.category === category && intervalsOverlap(start, end, toMinutes(item.time), toMinutes(item.time) + item.durationMinutes))
  if (category !== "Promos" && sameCategoryOverlaps) return false
  const points = new Set([start, end])
  for (const item of booked) {
    const itemStart = toMinutes(item.time)
    const itemEnd = itemStart + item.durationMinutes
    if (intervalsOverlap(start, end, itemStart, itemEnd)) {
      points.add(Math.max(start, itemStart))
      points.add(Math.min(end, itemEnd))
    }
  }
  const sorted = [...points].sort((a, b) => a - b)
  return !sorted.slice(0, -1).some((point, index) => {
    const next = sorted[index + 1]
    const concurrent = booked.filter((item) => intervalsOverlap(point, next, toMinutes(item.time), toMinutes(item.time) + item.durationMinutes)).length
    return category === "Promos" ? concurrent >= 2 && booked.filter((item) => item.category === "Promos" && intervalsOverlap(point, next, toMinutes(item.time), toMinutes(item.time) + item.durationMinutes)).length >= 2 : concurrent >= 2
  })
}

export function isOnlineCategory(category: string): category is OnlineCategory {
  return ONLINE_CATEGORIES.includes(category as OnlineCategory)
}

export function whatsappUrl(message = "Hola, quisiera consultar por horarios.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
