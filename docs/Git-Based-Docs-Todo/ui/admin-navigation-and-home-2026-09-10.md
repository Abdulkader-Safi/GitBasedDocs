---
id: "admin-navigation-and-home-2026-09-10"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T10:05:00.000Z"
modified: "2026-09-10T10:05:00.000Z"
labels: ["ui", "admin"]
order: 21
---

# Admin navigation and home

Safi could not find the Sync now button: it lived on `/admin/connection`, and nothing in the reader pages linked to the admin area at all. The only way in was typing the URL.

Done when:

- [x] An admin can reach the admin area from any reader page.
- [x] Sync now is on the admin home, not only buried in connection settings.

Built:

- The top bar shows an Admin link to admins on the reader home, doc pages and the 404. Viewers never see it.
- In the admin area, the Admin tag links to `/admin` and the GitBasedDocs wordmark always goes back to the docs.
- `app/admin/page.tsx` moved from the unstyled scaffold to the design: a GitHub connection card with repo, branch and status badge, a Projects card with active and archived counts, and the Sync panel.
- `SyncPanel` moved to `components/admin/sync-panel.tsx` so the admin home and the connection page share it.

Verified in the browser: from `/p/docs/Welcome` the Admin link lands on `/admin`, which shows `Abdulkader-Safi/docs · main`, Connected, `1 active · 0 archived`, and the Sync panel reporting `fdf5b6a` synced.
