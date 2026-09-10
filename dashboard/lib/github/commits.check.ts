// Runnable check: bun lib/github/commits.check.ts
import assert from "node:assert/strict"

import { commitFrom } from "./commits"

const api = [
  {
    sha: "f5e132e0c1d2",
    author: { login: "Abdulkader-Safi" },
    commit: {
      author: { name: "Abdulkader Safi", date: "2026-09-10T14:32:24Z" },
      message: "vault backup: 2026-09-10 17:32:24\n\nAffected files: 11",
    },
  },
]
const c = commitFrom(api)
assert.deepEqual(c, {
  sha: "f5e132e0c1d2",
  author: "Abdulkader Safi",
  at: new Date("2026-09-10T14:32:24Z"),
  message: "vault backup: 2026-09-10 17:32:24",
}, "first line of the message only")

// no author name falls back to the login, then "unknown"
assert.equal(commitFrom([{ ...api[0], commit: { ...api[0].commit, author: { date: "2026-09-10T00:00:00Z" } } }])?.author, "Abdulkader-Safi")
assert.equal(commitFrom([{ sha: "a", commit: { author: { date: "2026-09-10T00:00:00Z" } } }])?.author, "unknown")
// nothing usable
assert.equal(commitFrom([]), null, "a file with no history")
assert.equal(commitFrom({ message: "Not Found" }), null)
assert.equal(commitFrom([{ sha: "a", commit: { author: { date: "not a date" } } }]), null)

console.log("commit checks ok")
