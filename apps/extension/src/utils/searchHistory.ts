export function formatHistoryDate(value: string | null) {
  if (!value) return "Unknown"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

export function formatRawCount(value: number | null) {
  return value === null ? "Unknown" : value.toLocaleString()
}