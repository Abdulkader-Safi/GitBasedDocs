---
id: "access-helper-and-member-management-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T12:00:00.000Z"
labels: ["access", "security"]
order: 16
---

# Access helper and member management

One helper `requireProjectAccess(userId, projectSlug)` used by all pages, asset routes, search routes, and history routes. Admin bypass is the single exception. Admin only invite (pick user, pick project) and instant remove. Deactivate blocks all reads, rows kept for audit. Log opens and denied attempts.

Spec: `docs/features/05-access-control.md`.

Checks to pass:

- [x] Viewer A cannot open project B page or asset. All 404. The search half moved to the search card, which adds the only search route.
- [x] Removed member loses access on next request without sign out.
- [x] Inactive project 404s even for linked viewers.

Progress (2026-09-10): the helper landed with the viewer card, as `lib/access/access.ts`, with a check against a real schema in `lib/access/access.check.ts`. Still to do here: the admin invite and remove UI, and logging opens and denied attempts to `access_logs`. The first check stays open until the asset and search routes exist and go through the helper.

Progress (2026-09-10, member management): `lib/access/members.ts` (`listMembers`, `listGrantableUsers`, `addMember`, `removeMember`) and `GET/POST/DELETE /api/admin/projects/[id]/members`. The Projects admin page moved onto the design and each project row has a Members panel: pick a person, Give access, trash to remove. Admins are left out of the picker since they already see every project, and deactivated accounts cannot be added. Adding someone twice is a no-op. The row also shows its page count, which the projects card left for once sync existed.

Verified with a temporary viewer account and a signed session cookie (no password typed into a browser), through the real routes:

| State | Home | `/p/docs` | Page | Admin API |
| --- | --- | --- | --- | --- |
| Not a member | empty state | 404 | 404 | 401 |
| Access granted | shows Docs | 200 | 200 | 401 |
| Access removed, same session | empty state | 404 | 404 | 401 |

In the browser as admin, Give access moved the count from 0 to 1 and listed the reader; the trash button took it back to 0. The test account was deleted afterwards.

Still to do on this card: logging opens and denied attempts to `access_logs` with an admin view of the last 500.

Done (2026-09-10, access log): `checkProjectAccess` returns the same decision as `requireProjectAccess` plus the project row when one exists, so the log can name which project a denied request aimed at. Readers still get the same bare 404. `logAccess` writes one `access_logs` row per page open and per denied page or asset request, from `after()` so it never delays a response, and never throws into the page. Allowed image loads are not logged; they would drown the page opens. Rows older than 90 days are pruned on each scheduler tick.

`/admin/access` lists the newest 500 events with filters for user, project and result, as a plain GET form (no client code, and a filtered view is a shareable URL). The admin home has an Access log card with the denied count for the last 7 days.

Verified: a temporary viewer's requests to a project they are not in, a project that does not exist, and an image all returned the same 404, and the log recorded each with the right project (or "no such project"). The denied filter showed those four; the allowed filter showed the admin's own page open. The test account and its log rows were deleted afterwards. `lib/access/access.check.ts` now also covers `checkProjectAccess`.

Update (2026-09-10): the search half of the first check is now verified on the search card. A non-member's search returns the same 404, and the attempt lands in the access log.
