# Sync without GitHub Actions

## Requirement

The content repo stays clean. No `.github/workflows` files, no deploy hooks owned by us beyond an optional webhook. The Next.js app pulls on its own.

## Sync triggers, in priority order

1. Webhook on push (fast path). Repo sends `push` events to `/api/webhooks/github`. App checks signature, reads the new head sha, and queues a delta sync.
2. Manual "sync now" button in admin (repair path). Used after token change, webhook miss, or first setup.
3. Timed recheck (safety net). Every 5 to 15 minutes the app compares the stored head sha with the remote head sha through one cheap call. If they differ, it runs a delta sync.

If the host has no public URL for webhooks, triggers 2 and 3 still keep content fresh. Webhook is nice to have, never required.

## Delta sync steps

1. Read stored `lastSyncedSha` for the repo link.
2. Call `GET /repos/{owner}/{repo}/commits?per_page=1` or `GET /repos/{owner}/{repo}/git/refs/heads/{branch}` to get remote head sha.
3. If shas match, stop and record `checkedAt`.
4. Else call `GET /git/trees/{headSha}?recursive=1` and diff against the stored index by path and blob sha.
5. For added or changed `.md` and `.mdx` files under mapped project folders: fetch blob, parse frontmatter, update index rows.
6. For deleted files: mark index rows deleted, keep them for 30 days for restore and redirect hints, then purge.
7. For images and attachments under mapped folders: fetch and cache under `public/cache` or object storage with content hash names.
8. Store new `lastSyncedSha`, sync log entry, per file status.

## Webhook endpoint details

- Route: `POST /api/webhooks/github`.
- Check `X-Hub-Signature-256` against the stored webhook secret before any other work.
- Accept only `push` to the tracked branch. Ignore other branches and other event types with a 200 and a log line.
- Work must be async: reply 200 fast, then process the queue in the background so GitHub does not time out and retry.
- Store delivery id (`X-GitHub-Delivery`) and skip repeats.

## Timed recheck details

- Use a small interval runner. On Vercel style hosts use a cron route. On a single Docker host use a `setInterval` worker or system cron hitting `/api/sync/check`.
- One call per check. Compare shas only. Full tree fetch happens only on change.
- Back off on 403 or 429: wait 60 seconds, then 5 minutes, then alert admin.

## Failure modes

- Token revoked: mark connection `error`, show admin banner, keep serving last good index with a "content may be stale" note.
- Webhook secret mismatch: return 401, log IP and delivery id, no sync.
- Truncated tree: fall back to per folder Contents listing for that sync.
- Partial fetch fail: keep old row, mark file `stale`, retry next cycle. Never blank a page because one fetch failed.
