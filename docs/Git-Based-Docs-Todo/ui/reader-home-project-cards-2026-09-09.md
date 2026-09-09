---
id: "reader-home-project-cards-2026-09-09"
status: "todo"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T18:50:00.000Z"
modified: "2026-09-09T18:50:00.000Z"
labels: ["ui", "viewer"]
order: 20
---

# Reader home project cards

Replace the scaffold at `/` with the real project grid: top bar, "Projects" title, three column card grid on desktop and two at the 982px minimum. Each card shows name, description (two lines), and a mono meta line with page count and last update. Empty state reads "No projects shared with you yet. Contact your admin."

Admins see all active projects, viewers see linked ones only. Archived projects never appear.

Design: `docs/design/pages-theme-and-content.md` page 2, Figma frames `Reader home / 1512` and `Reader home / 982`.

Done when:

- [ ] A viewer only sees projects they are linked to.
- [ ] Page counts come from `doc_pages`, excluding deleted and draft rows.
