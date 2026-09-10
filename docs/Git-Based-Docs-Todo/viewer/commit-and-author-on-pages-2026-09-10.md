---
id: "commit-and-author-on-pages-2026-09-10"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-10T19:45:00.000Z"
modified: "2026-09-10T21:30:00.000Z"
labels: ["viewer", "sync"]
order: 30
---

# Commit and author on pages

Safi wants readers to see more of Git. Under each page title: "Updated 3 minutes ago by Safi · f5e132e", where the commit links to GitHub for admins and editors.

- [x] Sync asks GitHub for the last commit touching each changed file (one extra call per changed page) and stores its sha, author name and date.
- [x] The page meta line shows author and short sha; the time comes from the commit, not the sync.
- [x] Viewers see the author and time but no link, since the repo is private.

What shipped:

- `lib/github/commits.ts`: `lastCommit()` asks `GET /repos/{o}/{r}/commits?sha=<head>&path=<file>&per_page=1` for each fetched page; failures return null so the page still syncs. `commitFrom()` has a check in `commits.check.ts`.
- Migration 0009 adds `last_commit_sha`, `last_commit_author`, `last_commit_at`, `last_commit_message` to `doc_pages` and clears blob shas once so every page records its commit. After it ran, 11 of 11 pages had one.
- Meta line: "Updated 1 hour ago by Abdulkader Safi · f5e132e"; the time is the commit's, with the sync time as fallback. The sha links to the commit for admins and editors and shows the commit's first line on hover.
- `reading-docs.md` in the vault describes it, plus the page width and outline buttons.

Changed after review: Safi wants repo details for admins only. The commit id and "View on GitHub" now show for admins; editors and viewers see "Updated ... by <author>" and nothing that links into the repo. Checked over HTTP with an admin, an editor and a viewer.
