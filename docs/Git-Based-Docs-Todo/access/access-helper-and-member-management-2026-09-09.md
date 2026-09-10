---
id: "access-helper-and-member-management-2026-09-09"
status: "in-progress"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T09:20:00.000Z"
labels: ["access", "security"]
order: 16
---

# Access helper and member management

One helper `requireProjectAccess(userId, projectSlug)` used by all pages, asset routes, search routes, and history routes. Admin bypass is the single exception. Admin only invite (pick user, pick project) and instant remove. Deactivate blocks all reads, rows kept for audit. Log opens and denied attempts.

Spec: `docs/features/05-access-control.md`.

Checks to pass:

- [ ] Viewer A cannot open project B page, asset, or search. All 404.
- [x] Removed member loses access on next request without sign out.
- [x] Inactive project 404s even for linked viewers.

Progress (2026-09-10): the helper landed with the viewer card, as `lib/access/access.ts`, with a check against a real schema in `lib/access/access.check.ts`. Still to do here: the admin invite and remove UI, and logging opens and denied attempts to `access_logs`. The first check stays open until the asset and search routes exist and go through the helper.

