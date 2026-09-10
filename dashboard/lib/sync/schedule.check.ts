// Runnable check for the recheck scheduler: bun lib/sync/schedule.check.ts
import assert from "node:assert/strict"

import { intervalFromEnv, nextDelay } from "./schedule"

const MIN = 60_000
const TEN = 10 * MIN

// interval: default 10, clamped to the 5 to 15 minute window from the spec
assert.equal(intervalFromEnv(undefined), 10 * MIN)
assert.equal(intervalFromEnv("7"), 7 * MIN)
assert.equal(intervalFromEnv("1"), 5 * MIN, "floor at 5 minutes")
assert.equal(intervalFromEnv("60"), 15 * MIN, "ceiling at 15 minutes")
assert.equal(intervalFromEnv("abc"), 10 * MIN)
assert.equal(intervalFromEnv("0"), 10 * MIN)
assert.equal(intervalFromEnv("-3"), 10 * MIN)

// healthy runs keep the normal cadence and clear strikes
assert.deepEqual(nextDelay(0, false, TEN), { delay: TEN, strikes: 0 })
assert.deepEqual(nextDelay(2, false, TEN), { delay: TEN, strikes: 0 }, "a good run resets the back-off")

// rate limited: 1 minute, then 5, then back to the normal cadence
assert.deepEqual(nextDelay(0, true, TEN), { delay: 1 * MIN, strikes: 1 })
assert.deepEqual(nextDelay(1, true, TEN), { delay: 5 * MIN, strikes: 2 })
assert.deepEqual(nextDelay(2, true, TEN), { delay: TEN, strikes: 3 })
assert.deepEqual(nextDelay(9, true, TEN), { delay: TEN, strikes: 10 }, "never retries faster than normal once past the back-off")

console.log("schedule checks ok")
