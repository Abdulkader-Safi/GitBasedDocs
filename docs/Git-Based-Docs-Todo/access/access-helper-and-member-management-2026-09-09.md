---
id: "access-helper-and-member-management-2026-09-09"
status: "in-progress"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T11:00:00.000Z"
labels: ["access", "security"]
order: 16
---

# Access helper and member management

One helper `requireProjectAccess(userId, projectSlug)` used by all pages, asset routes, search routes, and history routes. Admin bypass is the single exception. Admin only invite (pick user, pick project) and instant remove. Deactivate blocks all reads, rows kept for audit. Log opens and denied attempts.

Spec: `docs/features/05-access-control.md`.

Checks to pass:

- [ ] Viewer A cannot open project B page, asset, or search. All 404. (Pages and assets verified; search has no route yet.)
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

