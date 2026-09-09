---
id: "credentials-login-page-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T12:50:25.000Z"
labels: ["auth"]
order: 3
---

# Credentials login page

Build `/login` with next-auth v4 credentials provider: shadcn Card, email plus password, show toggle, generic error on failure. DB sessions, httpOnly cookie. Rate limit 5 tries per 15 min per IP and per email.

Spec: `docs/features/01-authentication.md`.

Done when:

- [x] Wrong password and inactive user show the same generic message.
- [x] Sign out clears the session row and lands on `/login`.

Notes: Next 16 uses `proxy.ts`, not `middleware.ts`. The proxy only checks cookie presence, real validation is `getServerSession` in pages and routes. Verified: `/login` 200, `/` 307 to login, adapter user plus session roundtrip works.
