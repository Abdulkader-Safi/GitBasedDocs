import { lt } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { syncLogs } from "@/lib/db/schema"
import { getConnection } from "@/lib/github/connection"
import { runSync } from "@/lib/sync/sync"

const MINUTE = 60_000
// Spec: after a 403 or 429, retry in 1 minute, then 5, then fall back to the
// normal cadence. The connection stays in "error" with the rate limit
// message meanwhile, which is what raises the admin banner.
const BACKOFF = [1 * MINUTE, 5 * MINUTE]
const KEEP_LOGS_MS = 30 * 24 * 60 * MINUTE

export function intervalFromEnv(raw: string | undefined): number {
  const minutes = Number(raw)
  // Clamp to the 5 to 15 minute window from the spec.
  const clamped = Number.isFinite(minutes) && minutes > 0 ? Math.min(Math.max(minutes, 5), 15) : 10
  return clamped * MINUTE
}

// How long to wait before the next run, and the strike count to carry.
export function nextDelay(
  strikes: number,
  rateLimited: boolean,
  intervalMs: number,
): { delay: number; strikes: number } {
  if (!rateLimited) return { delay: intervalMs, strikes: 0 }
  const delay = strikes < BACKOFF.length ? BACKOFF[strikes] : intervalMs
  return { delay, strikes: strikes + 1 }
}

// ponytail: in-process timer, started once from instrumentation.ts. Right for
// the single long-running node process v1 deploys as. On serverless hosts,
// swap this for a platform cron hitting a sync route.
export function startSyncSchedule(intervalMs: number) {
  const g = globalThis as { __gbdSyncSchedule?: boolean }
  if (g.__gbdSyncSchedule) return
  g.__gbdSyncSchedule = true

  let strikes = 0
  const tick = async () => {
    let delay = intervalMs
    try {
      // No repo linked yet: nothing to check, and no log row every tick.
      if (await getConnection()) {
        const result = await runSync("cron")
        const next = nextDelay(strikes, result.rateLimited, intervalMs)
        delay = next.delay
        strikes = next.strikes
        if (result.status === "synced") {
          console.info(
            `[sync] scheduled run +${result.added} ~${result.changed} -${result.removed}`,
          )
        }
      }
      // The recheck adds a log row per tick, so cap how long they live.
      const db = await getDb()
      await db.delete(syncLogs).where(lt(syncLogs.createdAt, new Date(Date.now() - KEEP_LOGS_MS)))
    } catch (e) {
      console.error("[sync] scheduled run failed", e)
    }
    setTimeout(tick, delay).unref?.()
  }

  // First check shortly after boot, to catch up on pushes missed while down.
  setTimeout(tick, 5_000).unref?.()
}
