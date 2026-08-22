/** ISO (YYYY-MM-DD) date helpers. UTC throughout, matching the rate publication dates. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function today(now = new Date()): string {
  return toIsoDate(now)
}

export function daysAgo(days: number, now = new Date()): string {
  const date = new Date(now)
  date.setUTCDate(date.getUTCDate() - days)
  return toIsoDate(date)
}
