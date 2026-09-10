---
id: "admin-nav-and-layout-2026-09-10"
status: "todo"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T12:00:00.000Z"
modified: "2026-09-10T12:00:00.000Z"
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

- [ ] Every admin page links to every other admin page.
- [ ] Projects can be edited from the UI.
