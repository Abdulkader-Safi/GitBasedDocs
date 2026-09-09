# AGENTS.md

## Layout

- `dashboard/` is the only app (Next.js 16, React 19, Tailwind v4, shadcn `base-lyra`). No root workspace, no CI, no tests.
- `docs/` holds planning specs only. Nothing there runs. Source of truth until build starts: `docs/README.md` reading order, then `docs/features/README.md` build order.
- `dashboard/AGENTS.md` (Next.js agent-rules block) still applies when writing app code.

## Commands

Run everything from `dashboard/` (root has no scripts):

- `bun dev` / `bun run build` / `bun start`
- `bun run lint` (eslint flat config, next core-web-vitals + typescript)
- `bun run typecheck` (`tsc --noEmit`)
- `bun run format` (prettier: no semicolons, double quotes, tailwind plugin)

Verify order: `lint` -> `typecheck` -> `build`. There is no test runner; `build` is the final check. `bun.lock` exists, so prefer `bun` over `npm`.

## Conventions

- Path alias is `@/*` mapped to `dashboard/*` (not `src/*`): `@/components`, `@/lib`, `@/app`.
- Add UI via `npx shadcn@latest add <component>` into `components/ui`. Style is `base-lyra`, RTL enabled, icons are Remix (`@remixicon/react`), theme via `components/theme-provider.tsx`.
- Before writing Next.js code, read the relevant guide in `dashboard/node_modules/next/dist/docs/` (per `dashboard/AGENTS.md`). Next 16 breaks from training-data defaults.
- Planned stack (not yet installed): next-auth v4, Drizzle ORM (SQLite local, Postgres deploy), GitHub API content reads. Check `docs/research/05-auth-data-and-multitenancy.md` before adding any of these so driver and schema choices stay shared.

## Task board (MD Kanban)

- Board lives in `docs/Git-Based-Docs-Todo/`: one `*.md` file per task, grouped in work subfolders. A browser board renders these files, so edits here show up there.
- Frontmatter keys (`id`, `status`, `priority`, `assignee`, `dueDate`, `created`, `modified`, `labels`, `order`): keep them all on edit; `status` is `backlog`/`todo`/`in-progress`/`review`/`done`. Moving a card = changing `status` only. Always refresh `modified` to current UTC.
- New file naming: `<slug>-YYYY-MM-DD.md`, first `#` heading matches the title, `order` = current highest in column + 1.
- Confirm the task list with the user before creating more than three files. Delete a file only on explicit request.
