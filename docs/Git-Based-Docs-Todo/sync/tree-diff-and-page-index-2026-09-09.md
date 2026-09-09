---
id: "tree-diff-and-page-index-2026-09-09"
status: "todo"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["sync"]
order: 9
---

# Tree diff and page index

Delta sync core: compare remote head sha to stored sha, fetch full tree `recursive=1` on change, diff by path and blob sha, fetch changed Markdown blobs, parse frontmatter with `gray-matter`, upsert `doc_pages` rows. Missing paths marked deleted, kept 30 days. Every run writes a `sync_logs` row.

Spec: `docs/features/06-sync-and-cache.md`, `docs/research/03-sync-without-github-actions.md`.

Done when:

- [ ] Unchanged head sha stops after one cheap call and records `checkedAt`.
- [ ] Single file fetch fail keeps the old row, marks stale, retries next run.
