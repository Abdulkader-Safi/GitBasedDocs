---
id: "asset-cache-2026-09-09"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T10:40:00.000Z"
labels: ["sync"]
order: 12
---

# Asset cache

On sync, download images and attachments under mapped folders with the GitHub token, store by content hash, serve from `/api/assets/...` behind the project access check. Never link readers to `raw.githubusercontent.com`.

Spec: `docs/features/06-sync-and-cache.md`, `docs/research/04-rendering-markdown-in-nextjs.md`.

Done when:

- [x] Relative image paths in Markdown resolve to cached routes.
- [x] Missing asset shows an alt box, never a token URL.

Built:

- `lib/sync/assets.ts`: images (png, jpg, gif, webp, avif, svg, bmp, ico) and PDFs under project folders are collected in the same tree pass as pages and diffed by path and blob sha. Files are stored once under `ASSET_DIR` (default `data/assets`), named by git blob sha, which is already a content hash, so the same image at two paths is stored once. Writes go to a temp file then rename. Files no row points at are deleted after each run, crash leftovers included. Over 10 MB is skipped with a note. Asset moves count in the run totals.
- `app/api/assets/[projectSlug]/[...path]/route.ts`: same `requireProjectAccess` gate as pages. No session, no access, unknown file and traversal attempts are all a bare 404. `ETag` is the blob sha with `Cache-Control: private, no-cache`, so the browser keeps a copy but revalidates, which is where the access check runs. A sandboxed, script-free CSP plus `nosniff` keeps a hostile SVG opened directly from running.
- Renderer: an image not in the index becomes an "Image not found: name" box, never a failing request. Links to a PDF or image in the repo go through the asset route. Obsidian embeds `![[image.png]]`, `![[image.png|300]]` and `|300x200` resolve by path or by file name anywhere in the project, the way Obsidian does. A note embed `![[Other note]]` links to the note rather than transcluding it.
- Fixed a crash while in the renderer: a stray `%` in a link made `decodeURI` throw and took the whole page render down.
- The render cache key now includes the project's asset list, so adding an image replaces its alt box without the page itself changing.
- Migration `0004_backfill_assets` clears the synced sha once, so an install already at the repo head downloads its assets on the next run instead of waiting for a push.
- `.env.example` documents `ASSET_DIR`, `SYNC_INTERVAL_MINUTES` and `SYNC_SCHEDULE`.

Checks: `lib/sync/assets.check.ts` (MIME matching, and the guard that only a plain hash can become a file path), plus new cases in `lib/render/markdown.check.ts` for missing images, embeds, sizes, PDF links and malformed links.

Verified:

- Real sync of `sindresorhus/awesome` on a throwaway DB: 8 images downloaded, each file's recomputed git sha matched GitHub's, a no-change re-diff made 0 downloads, and a vanished row, its file and a stray `.tmp` were all cleaned up.
- In the browser with a real session: 200 `image/png` with ETag and CSP, 304 on revalidation, 404 for a missing path, another project and a `../` traversal, and the image decodes in an `<img>`. Without a cookie the request redirects to login.

Not seen on screen: an image inside one of Safi's own pages, since the vault has none yet. The first `![[image.png]]` pushed will exercise it.
