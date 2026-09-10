---
id: "critique-round-2-top-five-2026-09-10"
status: "in-progress"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T19:45:00.000Z"
modified: "2026-09-10T19:45:00.000Z"
labels: ["ux", "a11y", "performance"]
order: 29
---

# Critique round 2: top five

From the second review (`.impeccable/critique/`, 27/40). Safi chose the top five first. One commit each.

- [x] Wide Mermaid diagrams keep a readable size: natural width with sideways scroll, and tap to open larger.
- [x] Phone pages menu is a real modal: Escape closes it, focus moves in and comes back, the page behind cannot be reached.
- [x] Every page has a browser tab title.
- [x] The Markdown renderer stays on the server: `pageHref` moves out of `lib/render/markdown.ts`, which becomes server-only.
- [ ] Archive from the Projects page opens the danger zone with that project picked.

Next tier, not started: focus outlines and a skip link, search snippet cleanup, contrast misses, small tap targets, generated temp passwords, access wording on the 404.
