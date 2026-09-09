---
id: "tree-diff-and-page-index-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T18:42:00.000Z"
labels: ["sync"]
order: 9
---

# Tree diff and page index

Delta sync core: compare remote head sha to stored sha, fetch full tree `recursive=1` on change, diff by path and blob sha, fetch changed Markdown blobs, parse frontmatter with `gray-matter`, upsert `doc_pages` rows. Missing paths marked deleted, kept 30 days. Every run writes a `sync_logs` row.

Spec: `docs/features/06-sync-and-cache.md`, `docs/research/03-sync-without-github-actions.md`.

Done when:

- [x] Unchanged head sha stops after one cheap call and records `checkedAt`.
- [x] Single file fetch fail keeps the old row, marks stale, retries next run.

Scope change: the connected repo is the docs repo, so sync reads the whole repo, not a `docs/` subfolder. `docsRoot` is now an optional narrowing filter and defaults to empty. A project's `repoPath` may also be empty, meaning the project owns the whole repo.

Built: `lib/sync/sync.ts` (`runSync`, in-process lock), helpers `pageSlug`, `titleFrom`, `excerptFrom`, `orderFrom`, `isDraftFrom`, `projectFor`. Migration `0002_majestic_ink.sql` adds `doc_pages.is_draft`. Checks in `lib/sync/sync.check.ts`, run with `bun lib/sync/sync.check.ts`.

Verified against `Abdulkader-Safi/GitBasedDocs` on a scratch DB:

- First run indexed 38 Markdown files across the whole repo, including root `AGENTS.md` and `dashboard/README.md`.
- Second run returned `unchanged` in 516 ms on one ref call.
- Forced diff run reported `changed: 1, removed: 1`: the edited page refetched back to `active`, a path missing from the tree flipped to `deleted`.
- Connection test now counts Markdown through the tree API, so nested pages count: "38 Markdown file(s) in the repo".

Left for the follow-up cards: webhook trigger, manual "Sync now" button and timed recheck (`sync/manual-sync-and-timed-recheck`), asset download (`sync/asset-cache`).
