# GitBasedDocs dashboard

Private docs site that reads Markdown from one GitHub repo. Next.js 16, next-auth v4, Drizzle on SQLite.

## Run locally

```bash
cp .env.example .env   # fill in the values, see below
bun install
bun run dev            # http://localhost:3000
```

Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. That account is created on the first login attempt, only while the users table is empty, and it must pick a new password right away. Then link the repo under Admin, GitHub connection.

## Environment

| Name | Needed | What it is |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | yes | Signs session cookies. `openssl rand -base64 32`. Changing it signs everyone out. |
| `NEXTAUTH_URL` | yes | Public address, for example `https://docs.example.com`. With `https` the cookie becomes `__Secure-next-auth.session-token`. |
| `DATABASE_URL` | yes | `file:./data/app.db`. Any URL `@libsql/client` accepts works. |
| `GITHUB_TOKEN` | yes | Fine-grained token with access to the content repo only: Contents read-only, Metadata read-only. |
| `GITHUB_WEBHOOK_SECRET` | for webhooks | Same string as the secret on the GitHub webhook. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first boot | First admin. Ignored once any user exists. Password needs 10 or more characters. |
| `ASSET_DIR` | no | Cached images and PDFs. Default `./data/assets`. |
| `SYNC_INTERVAL_MINUTES` | no | Timed recheck, 5 to 15. Default 10. |
| `SYNC_SCHEDULE` | no | `off` stops the timed recheck. Webhook and Sync now still work. |

## Deploy

```bash
bun install --frozen-lockfile
bun run build
bun run start          # from this folder, port 3000
```

- Run one instance. The sync lock, the timed recheck and the render cache live in the process. Two instances would sync twice and each keep its own cache.
- Put `data/` on a persistent volume: it holds the SQLite file and the asset files. Back up both together.
- Start from this folder and ship `drizzle/` with the build. Pending migrations run on the first database call after boot, so there is no separate migrate step.
- `next build` never opens the database, so the build can run without the volume.
- Put a TLS proxy in front (Caddy, nginx, Tailscale serve) and set `NEXTAUTH_URL` to the https address.

Postgres is not supported yet. The schema is SQLite only.

## GitHub webhook

In the content repo: Settings, Webhooks, Add webhook.

- Payload URL: `https://<your host>/api/webhooks/github`
- Content type: either works
- Secret: the value of `GITHUB_WEBHOOK_SECRET`
- Events: just the push event

A push shows up in the app a few seconds later. Without the webhook the timed recheck picks it up within `SYNC_INTERVAL_MINUTES`.

## Checks

Each logic unit has a runnable check next to it. The database ones refuse to run unless `DATABASE_URL` names their scratch file.

```bash
bun lib/sync/sync.check.ts
bun lib/sync/assets.check.ts
bun lib/sync/schedule.check.ts
bun lib/render/markdown.check.ts
bun lib/viewer/tree.check.ts
bun lib/github/webhook.check.ts
bun lib/github/commits.check.ts
DATABASE_URL=file:./data/access-check.db bun lib/access/access.check.ts
DATABASE_URL=file:./data/search-check.db bun lib/search/search.check.ts
DATABASE_URL=file:./data/users-check.db bun lib/users/users.check.ts
DATABASE_URL=file:./data/danger-check.db bun lib/admin/danger.check.ts
bun run lint && bun run typecheck && bun run build
```
