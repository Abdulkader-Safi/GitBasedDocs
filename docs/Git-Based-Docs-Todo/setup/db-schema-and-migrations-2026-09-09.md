---
id: "db-schema-and-migrations-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T12:42:21.000Z"
labels: ["setup", "db"]
order: 2
---

# DB schema and migrations

Create the shared Drizzle schema and first migration: next-auth v4 tables (`users` plus `role` and `isActive`, `accounts`, `sessions`, `verificationTokens`) and app tables (`projects`, `project_members`, `repo_connections`, `doc_pages`, `sync_logs`, `assets`, `access_logs`).

Driver note: SQLite runs on `@libsql/client`, not `better-sqlite3`, because better-sqlite3 NAPI crashes under Bun 1.3.14 while libsql works under both Bun and Node. Schema uses `sqlite-core`, so the Postgres port stays a mechanical mapping.

Spec: `docs/research/05-auth-data-and-multitenancy.md`.

Rules:

- Column types limited to text, integer, timestamp so SQLite and Postgres share the schema. Only driver and `drizzle.config.ts` dialect differ.
- Lazy DB connect at request time so `next build` passes with no DB running.

Done when:

- [x] `drizzle-kit generate` produces the migration, migrate runs clean on SQLite.
- [x] `lint`, `typecheck`, `build` pass.
