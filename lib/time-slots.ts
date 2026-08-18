export const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 9 + i
  return `${String(hour).padStart(2, "0")}:00`
})
