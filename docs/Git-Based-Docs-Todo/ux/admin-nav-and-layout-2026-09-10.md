---
id: "admin-nav-and-layout-2026-09-10"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T12:00:00.000Z"
modified: "2026-09-10T13:30:00.000Z"
labels: ["ux", "admin"]
order: 23
---

# Admin navigation and layout

- Admin sidebar on desktop, tabs on phones: Overview, Connection, Projects, Users, Sync runs, Access log, Danger zone, plus "Back to docs". No more bouncing through `/admin`.
- One content width for every admin page.
- Admin home: stat tiles (connection, pages, users, last sync, denied attempts) instead of five stacked link cards, then the sync panel and the latest runs.
- Danger zone on its own page, `/admin/danger`.
- Projects: list first, "New project" in a dialog like Users, an Edit dialog for name, slug, path and description, and an Open link to the docs.

Done when:

- [x] Every admin page links to every other admin page.
- [x] Projects can be edited from the UI.

What changed:

- `components/admin/admin-nav.tsx`: sidebar from `lg`, scrolling tab row below it that scrolls the current tab into view. "Back to docs" at the bottom of the sidebar.
- `app/admin/layout.tsx` sets one 1120px content width; pages dropped their own widths.
- Overview: five stat tiles (GitHub, projects, pages, users, denied in 7 days; denied turns red when above 0), the sync panel, and the last 5 runs. The runs table moved to `components/admin/sync-runs.tsx` and is shared with `/admin/sync`.
- Danger zone moved to `/admin/danger`. Project "Archive" links there.
- Projects: list first, one dialog for create and edit (name, slug, path, description), Open link, empty state with a create button.
- Dialogs focus their first field (showModal was focusing the close button).
- Page header stacks on phones. The access log also got a stacked phone layout with the result first.
