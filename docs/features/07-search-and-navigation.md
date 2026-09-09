# 07 Search and navigation

## Purpose

Help readers find a page fast inside their own project without seeing other projects.

## Navigation

- Sidebar built from the index: folders as groups, pages sorted by `order` then name.
- `_meta.json` or `index.md` header in a folder sets group label and order. Without it, folder name is the label.
- Breadcrumb shows project name plus folder trail plus page title.
- Prev and next links at page bottom follow sidebar order.

## Search

- Scoped to one project. No global search across projects in v1.
- Index is local: title, headings, and plain text excerpt per page row. Query runs in SQLite (`LIKE` plus rank) or Postgres (`tsvector`) against rows of that project only.
- Results show title, path trail, and one snippet line. Click goes to the page with the query term highlighted when present.
- Empty query shows recent pages in that project for that user. No query ever returns rows from unlinked projects.

## Behavior details

- Search route checks project access first, then queries. Same 404 rule for outsiders.
- Reindex happens during sync when a blob sha changes. No separate search cron.
- Max excerpt stored per page is about 2,000 chars to keep the DB small.

## UI

- Command palette (`Cmd+K`) on desktop with shadcn Dialog, project badge on each result.
- Mobile search input above sidebar drawer.

## Out of scope for v1

- Full text search service, typo tolerant search, search across all projects for admins.
