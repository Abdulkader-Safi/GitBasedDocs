---
id: "admin-settings-and-deploy-notes-2026-09-09"
status: "todo"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["admin", "deploy"]
order: 18
---

# Admin settings and deploy notes

Settings screen: users table (role, active flag, project count, last login; actions create, edit role, deactivate, reset password, revoke sessions), GitHub link panel (status badge, short sha, last check, test plus sync now, webhook URL copy), last 50 sync runs with expandable errors, danger zone (archive project, purge deleted pages past 30 days, clear HTML cache) behind typed confirm with audit lines.

Spec: `docs/features/08-admin-settings.md`.

Deploy: SQLite file volume plus `AUTH_SECRET`, `DATABASE_URL`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` locally. Postgres `DATABASE_URL` plus `drizzle-kit migrate` and `AUTH_URL` in deploy.

Done when:

- [ ] Every danger action needs typed confirm and writes an audit line.
- [ ] `lint`, `typecheck`, `build` pass as the final check.
