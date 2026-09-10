---
id: "admin-settings-and-deploy-notes-2026-09-09"
status: "in-progress"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T09:30:00.000Z"
labels: ["admin", "deploy"]
order: 18
---

# Admin settings and deploy notes

Settings screen: users table (role, active flag, project count, last login; actions create, edit role, deactivate, reset password, revoke sessions), GitHub link panel (status badge, short sha, last check, test plus sync now, webhook URL copy), last 50 sync runs with expandable errors, danger zone (archive project, purge deleted pages past 30 days, clear HTML cache) behind typed confirm with audit lines.

Spec: `docs/features/08-admin-settings.md`.

Deploy: SQLite file volume plus `AUTH_SECRET`, `DATABASE_URL`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` locally. Postgres `DATABASE_URL` plus `drizzle-kit migrate` and `AUTH_URL` in deploy.

Progress:

- [x] GitHub link panel: done earlier on `/admin/connection` plus the sync panel on `/admin`.
- [x] Users at `/admin/users`: table with role, status, project count and last login. Create, edit (name, role, projects), deactivate, reset password and revoke sessions. Admin-set passwords force a change on next login (`/account/password`). Reset and revoke end every existing session on its next request (`users.sessions_revoked_at`, migration 0005). Guards: nobody can demote or deactivate themselves, and the last active admin stays. Password rule: 10 to 200 characters, not on the common list, not the email name. Check: `lib/users/users.check.ts`. Verified over HTTP with minted sessions.
- [x] Sync runs at `/admin/sync`: last 50 runs with when, trigger, status, commit, counts and duration. Rows with errors open (native `<details>`) to show each line, with the failing path split out. `sync_logs.status` added in migration 0006 and backfilled for old rows. Admin home has a "Sync runs" card with the last run.
- [ ] Danger zone with typed confirm and audit lines.
- [ ] Deploy notes.

Done when:

- [ ] Every danger action needs typed confirm and writes an audit line.
- [ ] `lint`, `typecheck`, `build` pass as the final check.
