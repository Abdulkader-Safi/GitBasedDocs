# 04 Doc viewer

## Purpose

Show Markdown pages as clean docs with sidebar, headings, code, and images. This is the screen clients use daily.

## Route shape

- `/p/{projectSlug}`: project landing, shows index page or first ordered page.
- `/p/{projectSlug}/[...pageSlug]`: any nested page like `/p/acme/api/auth`.

## Behavior

- Server component loads session, runs the project access check, then loads the page row from the index.
- Sidebar lists the project tree with folders, page order, and active highlight. Collapses on mobile to a drawer.
- Page header shows title, description, and "updated {date}" from last commit touching that path.
- Body renders sanitized HTML: GFM tables, task lists, fenced code with language label and copy button, callouts (`> [!NOTE]` style), anchor links on h2 and h3.
- Relative links stay inside the project. Links outside open in a new tab with `rel="noreferrer"`.
- Images load from `/api/assets/...` after the same access check. Broken or missing images show an alt box, never a broken token URL.
- Draft pages (`draft: true`) return 404 for viewers, render with an amber "draft" badge for admins.
- Missing page returns the project 404 with links to search and home. No project name leak for non members: outsiders get the same 404 as a bad slug.

## UI

- shadcn Sidebar or custom two pane layout, breadcrumb on top, prose styles for body, dark mode kept from the current theme provider.
- Print friendly: sidebar hidden on print, code wraps.

## Performance

- HTML cached per blob sha. Tree cached per head sha. Page loads hit our DB, not GitHub, except right after a sync.
- Prefetch sibling pages in sidebar on hover for desktop.

## Out of scope for v1

- Comments, page ratings, PDF export, version picker per commit.
