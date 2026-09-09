# 06 Sync and cache

## Purpose

Keep pages fresh from GitHub with no Actions in the content repo, and keep reads fast when GitHub is slow.

## Triggers

- Webhook push to tracked branch: verify signature, reply 200 fast, queue delta sync.
- Manual "sync now" per connection in admin, with run log.
- Timed recheck every 5 to 15 minutes: compare remote head sha to stored sha, sync only on change.

## Delta sync

1. Fetch remote head sha for the branch.
2. If equal to stored sha, record `checkedAt` and stop.
3. Else fetch full tree `recursive=1` at head sha.
4. Diff by path and blob sha against `doc_pages` and `assets`.
5. Fetch changed Markdown blobs, parse frontmatter, upsert page rows.
6. Fetch changed assets, store by content hash.
7. Mark missing paths deleted, keep 30 days for restore hints.
8. Write `sync_logs` row and update `lastSyncedSha`.

## Cache rules

- Nav tree cached per head sha per project.
- Page HTML cached per blob sha.
- Asset bytes cached per content hash with long cache headers plus access check on each request.
- Search excerpt stored per page row, refreshed on blob change.

## Sync log

- Each run stores trigger, head sha, counts (added, changed, removed), error text, duration.
- Admin page lists last 50 runs with status color and expandable error.

## Failure behavior

- Token fail: status error, keep serving last good pages with "may be stale" note for admins only. Viewers see no token details.
- Single file fail: keep old row, mark stale, retry next run.
- Timeout or rate limit: back off (1 min, 5 min), then alert on settings page.

## Out of scope for v1

- Two way edit from app to GitHub, branch preview, per page rollback UI.
