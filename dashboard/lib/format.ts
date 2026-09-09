const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// "4 minutes ago", "yesterday", "2 weeks ago". Meta lines only, so a rough
// bucket beats an exact timestamp.
export function relativeTime(value: Date | null, now: Date = new Date()): string {
  if (!value) return "never"
  const diff = now.getTime() - value.getTime()
  if (diff < MINUTE) return "just now"
  if (diff < HOUR) {
    const n = Math.floor(diff / MINUTE)
    return `${n} minute${n === 1 ? "" : "s"} ago`
  }
  if (diff < DAY) {
    const n = Math.floor(diff / HOUR)
    return `${n} hour${n === 1 ? "" : "s"} ago`
  }
  const days = Math.floor(diff / DAY)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const n = Math.floor(days / 7)
    return `${n} week${n === 1 ? "" : "s"} ago`
  }
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? "" : "s"} ago`
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
