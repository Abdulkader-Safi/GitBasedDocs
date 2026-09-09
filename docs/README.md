# Gitbased docs: project notes

This folder holds planning notes for the private docs system. Code lives in `dashboard/`. Nothing here runs. These files are the source of truth until build starts.

## Layout

- `research/`: how gitbased CMS tools work, how GitHub access works, and which path this project takes. Read these first.
- `features/`: what the app must do. One file per feature. Each file lists behavior, rules, data, UI, and edge cases.
- `Git-Based-Docs-Todo/`: the task board. One `*.md` file per build task, grouped in work subfolders. Rendered by a browser board, so edits here show up there.

## Current stack

- Next.js 16 in `dashboard/`, shadcn UI installed, Tailwind v4, theme provider present.
- Planned: next-auth v4, Drizzle ORM, SQLite for local self host, Postgres for deploy.
- Content source: one private GitHub repo, read through the GitHub API at request time. No GitHub Actions in the content repo.

## Reading order

1. `research/01-how-gitbased-cms-works.md`
2. `research/02-github-access-for-private-repos.md`
3. `research/03-sync-without-github-actions.md`
4. `research/04-rendering-markdown-in-nextjs.md`
5. `research/05-auth-data-and-multitenancy.md`
6. `features/` index, then each feature file in number order.
