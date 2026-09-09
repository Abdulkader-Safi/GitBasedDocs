# Auth, data, and multitenancy

## Login shape

next-auth v4 with a small custom Drizzle adapter (the `@auth/*` adapter line targets v5 only). One `[...nextauth]` route, `getServerSession` in server components and route handlers, `withAuth` middleware for page protection.

Start with two providers:

- Credentials (email plus password) for clients and staff. Passwords hashed with bcrypt or scrypt. This works on any self host with no extra setup.
- Optional GitHub OAuth for admins only. Readers never need GitHub accounts.

Session plan: database sessions so admin can revoke access at once. JWT sessions are simpler but revoke is harder. Pick database sessions for v1 because client offboarding matters here.

## Roles

Three roles keep the model small:

- Admin: manages projects, users, GitHub link, sync, settings.
- Editor: reserved for later. Can preview drafts and request sync. No user or token management.
- Viewer: reads projects linked to their account. Default for clients.

Role lives on the user row. Project access lives in a join table so one user can see more than one project and one project can have many users.

## Tables (Drizzle, shared for SQLite and Postgres)

next-auth needs: `users`, `accounts`, `sessions`, `verificationTokens`.

App adds:

- `projects`: id, slug, name, repo path, description, isActive, timestamps.
- `project_members`: projectId, userId, role override optional, addedBy, timestamps. Unique on (projectId, userId).
- `repo_connections`: id, owner, repo, branch, docsRoot, tokenRef, webhookSecretRef, lastSyncedSha, status, timestamps. One row for v1.
- `doc_pages`: id, projectId, path, slug, title, order, excerpt, blobSha, headSha, status, timestamps. Unique on (projectId, path).
- `sync_logs`: id, trigger (webhook, manual, cron), headSha, added, changed, removed, errors, durationMs, timestamps.
- `assets`: id, projectId, repoPath, hash, mimeType, size, timestamps.

SQLite locally uses `better-sqlite3` or `libsql`. Postgres in deploy uses `postgres-js` or Neon HTTP. Schema files stay shared. Only the driver and `drizzle.config.ts` dialect change. Keep column types to text, integer, and timestamp so both dialects accept them.

## Access check rule

Every docs read path runs the same check:

1. Session exists, else redirect to sign in.
2. Load project by slug. If missing or inactive, return 404.
3. Check `project_members` for (user, project). Admin bypasses this check.
4. If no row, return 404 (not 403) so project names do not leak.
5. Then serve nav and page from the index.

Apply the same check to asset routes and search routes scoped to that project.

## Self host notes

- Single Docker image, SQLite file mounted as a volume. Env vars: `AUTH_SECRET`, `DATABASE_URL`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`.
- Postgres switch is config only: change `DATABASE_URL` and driver, run `drizzle-kit migrate`.
- Build must not require a live DB. Lazy connect at request time so `next build` passes without Postgres running.
