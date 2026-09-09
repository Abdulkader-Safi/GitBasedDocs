---
id: "access-helper-and-member-management-2026-09-09"
status: "todo"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["access", "security"]
order: 16
---

# Access helper and member management

One helper `requireProjectAccess(userId, projectSlug)` used by all pages, asset routes, search routes, and history routes. Admin bypass is the single exception. Admin only invite (pick user, pick project) and instant remove. Deactivate blocks all reads, rows kept for audit. Log opens and denied attempts.

Spec: `docs/features/05-access-control.md`.

Checks to pass:

- [ ] Viewer A cannot open project B page, asset, or search. All 404.
- [ ] Removed member loses access on next request without sign out.
- [ ] Inactive project 404s even for linked viewers.
