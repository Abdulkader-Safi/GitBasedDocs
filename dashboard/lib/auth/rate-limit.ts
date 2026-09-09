// Fixed-window in-memory rate limit: 5 hits per 15 minutes per key.
const WINDOW_MS = 15 * 60 * 1000
const MAX_HITS = 5

const hits = new Map<string, number[]>()

export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (list.length >= MAX_HITS) {
    hits.set(key, list)
    return false
  }
  list.push(now)
  hits.set(key, list)
  return true
}
