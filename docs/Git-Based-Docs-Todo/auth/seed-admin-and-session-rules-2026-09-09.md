---
id: "seed-admin-and-session-rules-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T12:50:25.000Z"
labels: ["auth"]
order: 4
---

# Seed admin and session rules

Seed the first admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` on first boot, force password change on first login. Min 10 char passwords, block common list. Deleted user with live cookie resolves to null and redirects to `/login`.

Spec: `docs/features/01-authentication.md`.

Done when:

- [x] Fresh boot creates the admin once, never overwrites.
- [x] Revoking sessions logs the user out on next request.

Notes: verified seed once (role admin, mustChangePassword set), live session resolves, deleted user session returns null. Short seed passwords are refused with a console error. Forced change UI lands with the admin settings task.
