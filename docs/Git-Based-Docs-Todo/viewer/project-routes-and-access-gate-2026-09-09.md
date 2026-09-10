---
id: "project-routes-and-access-gate-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T09:20:00.000Z"
labels: ["viewer"]
order: 13
---

# Project routes and access gate

Routes `/p/{projectSlug}` (landing: index page or first ordered page) and `/p/{projectSlug}/[...pageSlug]`. Server components load session, run the project access check, then read from the index. Denied reads return 404, never 403. Draft pages 404 for viewers, render with badge for admins.

Spec: `docs/features/04-doc-viewer.md`, `docs/features/05-access-control.md`.

Done when:

- [x] Non member opening a page in that project gets 404. Assets and search do not have routes yet; they call the same `requireProjectAccess` when those cards land.
- [x] Page loads hit our DB, not GitHub, outside sync windows.

Built: one optional catch-all, `app/p/[projectSlug]/[[...pageSlug]]/page.tsx`, serves the landing and every nested page. `lib/access/access.ts` holds `requireProjectAccess`: missing, archived and not-a-member all return null and all become the same 404. Admins skip the membership check and nothing else, so an archived project is closed to them too. `app/not-found.tsx` is the single 404 and never names a project.

Page bodies are now stored at sync time (`doc_pages.content`, plus `description` and `size`, migration `0003`), so a page load is two DB reads and no GitHub call. That migration also rebuilds `repo_connections` to apply the `docs_root` default change from the sync card, which had been left unmigrated, and clears blob and head shas so the next sync backfills bodies for pages indexed before.

Drafts 404 for viewers and render with an amber Draft badge for admins. Stale pages keep serving their last good copy, with a "Showing last good copy." note for admins only.

Verified: `lib/access/access.check.ts` runs against a real schema on a throwaway DB (`DATABASE_URL=file:./data/access-check.db bun lib/access/access.check.ts`): members open only their own projects, archived is closed to members and admins, an unknown slug looks the same as a forbidden one, and removing a membership takes effect on the next check. In the browser, `/p/no-such-project` and `/p/docs/no-such-page` both return 404 with no project name in the page.
