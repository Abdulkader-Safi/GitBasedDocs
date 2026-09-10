// Runnable check for webhook verification: bun lib/github/webhook.check.ts
// Signature handling is the security boundary of this endpoint, so it is the
// part worth pinning down.
import assert from "node:assert/strict"
import { createHmac } from "node:crypto"

import {
  isRepeatDelivery,
  parsePayload,
  refMatchesBranch,
  resetDeliveryCache,
  verifySignature,
} from "./webhook"

const SECRET = "s3cret"
const body = JSON.stringify({ ref: "refs/heads/main" })
const sign = (b: string, secret = SECRET) =>
  "sha256=" + createHmac("sha256", secret).update(b).digest("hex")

// a genuine signature passes
assert.equal(verifySignature(body, sign(body), SECRET), true)

// every way it should fail
assert.equal(verifySignature(body, sign(body, "wrong"), SECRET), false, "wrong secret")
assert.equal(verifySignature(body + " ", sign(body), SECRET), false, "tampered body")
assert.equal(verifySignature(body, null, SECRET), false, "missing header")
assert.equal(verifySignature(body, sign(body), undefined), false, "unset secret")
assert.equal(verifySignature(body, "", SECRET), false, "empty header")
assert.equal(verifySignature(body, "deadbeef", SECRET), false, "no sha256 prefix")
// a truncated digest must not pass: length mismatch is rejected before compare
assert.equal(verifySignature(body, sign(body).slice(0, 20), SECRET), false, "short digest")
// sha1 style header from an older webhook config
assert.equal(verifySignature(body, "sha1=" + "0".repeat(40), SECRET), false, "sha1 header")

// branch matching: only the tracked branch, never tags
assert.equal(refMatchesBranch("refs/heads/main", "main"), true)
assert.equal(refMatchesBranch("refs/heads/dev", "main"), false)
assert.equal(refMatchesBranch("refs/tags/v1", "main"), false)
assert.equal(refMatchesBranch("refs/heads/main/extra", "main"), false)
assert.equal(refMatchesBranch(undefined, "main"), false)
assert.equal(refMatchesBranch("refs/heads/release", "release"), true)

// both content types GitHub can send parse to the same object
const json = { ref: "refs/heads/main", commits: [{ message: "a & b = c" }] }
assert.deepEqual(parsePayload(JSON.stringify(json), "application/json"), json)
const form = "payload=" + encodeURIComponent(JSON.stringify(json))
assert.deepEqual(parsePayload(form, "application/x-www-form-urlencoded"), json)
assert.deepEqual(parsePayload(JSON.stringify(json), null), json, "missing header falls back to JSON")
// the signature covers the raw form body, not the decoded JSON
assert.equal(verifySignature(form, sign(form), SECRET), true)
assert.throws(() => parsePayload("other=1", "application/x-www-form-urlencoded"))

// delivery ids are skipped the second time, and a missing id never blocks
resetDeliveryCache()
assert.equal(isRepeatDelivery("abc"), false, "first delivery runs")
assert.equal(isRepeatDelivery("abc"), true, "same delivery skipped")
assert.equal(isRepeatDelivery("def"), false, "different delivery runs")
assert.equal(isRepeatDelivery(null), false, "missing id never counts as repeat")
assert.equal(isRepeatDelivery(null), false)

console.log("webhook checks ok")
