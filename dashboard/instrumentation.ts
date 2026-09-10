// Runs once when the Next.js server boots. Starts the timed recheck so the
// index stays fresh even when a webhook is missing or misconfigured.
export async function register() {
  // The sync engine needs Node (libsql, crypto). Skip the edge runtime and
  // the build step, which also loads this file.
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NEXT_PHASE === "phase-production-build") return
  if (process.env.SYNC_SCHEDULE === "off") return

  const { intervalFromEnv, startSyncSchedule } = await import("@/lib/sync/schedule")
  const interval = intervalFromEnv(process.env.SYNC_INTERVAL_MINUTES)
  startSyncSchedule(interval)
  console.info(`[sync] timed recheck every ${interval / 60_000} minutes`)
}
