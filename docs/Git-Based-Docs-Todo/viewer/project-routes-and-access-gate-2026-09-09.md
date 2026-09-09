---
id: "project-routes-and-access-gate-2026-09-09"
status: "todo"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["viewer"]
order: 13
---

# Project routes and access gate

Routes `/p/{projectSlug}` (landing: index page or first ordered page) and `/p/{projectSlug}/[...pageSlug]`. Server components load session, run the project access check, then read from the index. Denied reads return 404, never 403. Draft pages 404 for viewers, render with badge for admins.

Spec: `docs/features/04-doc-viewer.md`, `docs/features/05-access-control.md`.

Done when:

- [ ] Non member opening a page, asset, or search in that project gets 404.
- [ ] Page loads hit our DB, not GitHub, outside sync windows.
