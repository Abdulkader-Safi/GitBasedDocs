---
id: "seed-admin-and-session-rules-2026-09-09"
status: "todo"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["auth"]
order: 4
---

# Seed admin and session rules

Seed the first admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` on first boot, force password change on first login. Min 10 char passwords, block common list. Deleted user with live cookie resolves to null and redirects to `/login`.

Spec: `docs/features/01-authentication.md`.

Done when:

- [ ] Fresh boot creates the admin once, never overwrites.
- [ ] Revoking sessions logs the user out on next request.
