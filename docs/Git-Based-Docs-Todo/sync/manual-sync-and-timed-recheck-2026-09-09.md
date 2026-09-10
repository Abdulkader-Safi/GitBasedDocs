---
id: "manual-sync-and-timed-recheck-2026-09-09"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T09:40:00.000Z"
labels: ["sync"]
order: 11
---

# Manual sync and timed recheck

"Sync now" button per connection with run log, plus timed recheck every 5 to 15 minutes comparing remote head sha to stored sha. Back off on 403 or 429 (1 min, then 5 min), then surface an alert on settings.

Spec: `docs/features/06-sync-and-cache.md`.

Done when:

- [x] Manual sync shows queued, running, done, error states.
- [x] Timed recheck with no change costs one cheap call.

Built:

- `app/api/admin/sync/route.ts`: `GET` returns whether a run is in flight and the last `sync_logs` row; `POST` runs a sync and answers when it finishes. A click during a run joins it through the in-process lock instead of starting a second one.
- `app/admin/connection/sync-panel.tsx`: the Sync now control on the connection page, with queued, running, done and error states and a last-run line.
- `lib/sync/schedule.ts` plus `instrumentation.ts`: the timed recheck starts once at server boot, runs 5 seconds after boot to catch up on anything missed while the app was down, then every `SYNC_INTERVAL_MINUTES` (default 10, clamped to 5 to 15). `SYNC_SCHEDULE=off` disables it. It skips the build step and the edge runtime, and does nothing until a repo is linked.
- Back-off: a 403 or 429 retries after 1 minute, then 5, then returns to the normal cadence. `runSync` now reports `rateLimited`. The connection stays in error with the rate limit message while this happens, which is what raises the admin banner.
- The connection reads "syncing" while a run is in flight.
- The recheck writes a log row per tick (144 a day at the default), so rows older than 30 days are pruned on each tick.

Checks: `lib/sync/schedule.check.ts` covers the interval clamp and the back-off sequence.

Verified:

- An unchanged recheck made exactly 1 GitHub call (`/git/refs/heads/main`) in 388 ms. A full run of the docs repo was 5 calls in 3.4 s.
- After a server restart the first scheduled run caught up a push that no webhook had delivered: `cron 6b7ef5d +1 ~1`.
- In the browser, Sync now showed "Syncing..." disabled with "Running. A large repo can take a minute." while the server reported a run in flight, then "Synced 953afdd: +0 ~3 -0 in 2.4s".
- `next build` does not start the timer.

The queued state is wired and the server side of it (joining the in-flight run) is covered by the lock, but I did not catch it on screen: it needs a second click landing inside a run that finishes in a couple of seconds.
