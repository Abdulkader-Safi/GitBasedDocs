import { createHmac, timingSafeEqual } from "crypto"

// GitHub signs the raw request body with the webhook secret and sends the
// digest as "sha256=<hex>". Compare in constant time so the endpoint cannot
// be used as an oracle to guess the secret byte by byte.
export function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !header) return false
  if (!header.startsWith("sha256=")) return false

  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex")
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  // timingSafeEqual throws on a length mismatch, and the length itself is
  // not a secret, so check it first.
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

// GitHub offers two content types and defaults to form. With form the body
// is "payload=<url-encoded JSON>"; the signature still covers the raw body,
// so verify first and parse second.
export function parsePayload(raw: string, contentType: string | null): unknown {
  const type = (contentType ?? "").toLowerCase()
  if (type.includes("application/x-www-form-urlencoded")) {
    const payload = new URLSearchParams(raw).get("payload")
    if (payload === null) throw new Error("Form body has no payload field")
    return JSON.parse(payload)
  }
  return JSON.parse(raw)
}

// "refs/heads/main" is a push to main. Tags and other branches are not.
export function refMatchesBranch(ref: unknown, branch: string): boolean {
  return typeof ref === "string" && ref === `refs/heads/${branch}`
}

// ponytail: in-process delivery cache. A repeat delivery would only trigger
// a redundant sync, which is idempotent and stops on the head sha check, so
// this is a cheap optimisation rather than a correctness guard. Move it to a
// table the day this runs on more than one node.
const SEEN_LIMIT = 500
const seen = new Set<string>()

export function isRepeatDelivery(id: string | null): boolean {
  if (!id) return false
  if (seen.has(id)) return true
  seen.add(id)
  if (seen.size > SEEN_LIMIT) {
    // Drop the oldest entries; Set preserves insertion order.
    for (const old of seen) {
      seen.delete(old)
      if (seen.size <= SEEN_LIMIT) break
    }
  }
  return false
}

export function resetDeliveryCache() {
  seen.clear()
}
