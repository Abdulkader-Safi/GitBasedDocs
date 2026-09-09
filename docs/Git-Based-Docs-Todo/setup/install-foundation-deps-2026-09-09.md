---
id: "install-foundation-deps-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T12:22:12.000Z"
labels: ["setup", "deps"]
order: 1
---

# Install foundation deps

Install the planned stack in `dashboard/` with bun: `next-auth` v4 stable, `drizzle-orm`, `drizzle-kit`, SQLite driver (`better-sqlite3`), Postgres driver (`postgres`), plus Markdown libs (`gray-matter`, `remark`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, `rehype-highlight`, `rehype-sanitize`). No adapter package: v4 gets a small custom Drizzle adapter (the `@auth/*` adapter line targets v5 only).

Spec: `docs/features/08-admin-settings.md` env notes, `docs/research/05-auth-data-and-multitenancy.md`.

Done when:

- [x] `bun run lint`, `bun run typecheck`, and `bun run build` all pass after install.
- [x] No live DB needed at build time.
