# 08 Admin settings

## Purpose

Give one screen to run the system: users, connection health, sync runs, and danger actions.

## Sections

### Users

- Table with name, email, role, active flag, project count, last login.
- Actions: create, edit role, deactivate, reset password, revoke sessions.
- Create form validates email unique and password min length.

### GitHub link

- Shows owner, repo, branch, docs root, status badge, last sha short hash, last check time.
- Buttons: test connection, sync now, rotate token hint.
- Webhook URL and secret shown with copy button and setup steps for GitHub repo settings.

### Sync runs

- Table of last 50 runs from `sync_logs` with trigger, sha, counts, duration, status.
- Row expands to error text and failed paths.

### Danger zone

- Archive project, purge deleted pages older than 30 days, clear HTML cache.
- Each action needs typed confirm. Each writes an audit line with admin name and time.

## Env and deploy notes

- Local self host: SQLite file volume plus env `AUTH_SECRET`, `DATABASE_URL`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` for seed.
- Deploy: same image with Postgres `DATABASE_URL`, run `drizzle-kit migrate` on boot, set `AUTH_URL` to public host.
- Build must pass with no live DB. Connect lazily at request time.

## Out of scope for v1

- Billing, audit export, SMTP invite mail, multi repo dashboard.
