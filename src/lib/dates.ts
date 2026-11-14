/** Today's date as YYYY-MM-DD in New York time (the launch market). */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now)
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). Positive if `to` is later. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

/** Friendly "confirmed" wording: "today", "3 days ago", "4 months ago", "over a year ago". */
export function timeAgo(iso: string | null, today: string = todayISO()): string {
  if (!iso) return 'never confirmed'
  const d = daysBetween(iso, today)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d} days ago`
  if (d < 365) {
    const m = Math.round(d / 30)
    return `${m} month${m === 1 ? '' : 's'} ago`
  }
  return 'over a year ago'
}

/** Fractional hour in New York time, e.g. 17.5 for 5:30pm. */
export function nycHourNow(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h + m / 60
}

/** Is a restaurant with these hours open at `hour`? Handles past-midnight closes (close > 24). */
export function isOpenAt(hours: { open: number; close: number }, hour: number): boolean {
  if (hour >= hours.open && hour < hours.close) return true
  // Past-midnight window, e.g. open 12, close 26 means open until 2am.
  return hours.close > 24 && hour + 24 < hours.close
}

export function formatHour(h: number): string {
  const hh = Math.floor(h) % 24
  const suffix = hh >= 12 ? 'pm' : 'am'
  const display = hh % 12 === 0 ? 12 : hh % 12
  return `${display}${suffix}`
}
