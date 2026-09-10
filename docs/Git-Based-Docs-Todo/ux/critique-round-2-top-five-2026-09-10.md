---
id: "critique-round-2-top-five-2026-09-10"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T19:45:00.000Z"
modified: "2026-09-10T20:45:00.000Z"
labels: ["ux", "a11y", "performance"]
order: 29
---

# Critique round 2: top five

From the second review (`.impeccable/critique/`, 27/40). Safi chose the top five first. One commit each.

- [x] Wide Mermaid diagrams keep a readable size: natural width with sideways scroll, and tap to open larger.
- [x] Phone pages menu is a real modal: Escape closes it, focus moves in and comes back, the page behind cannot be reached.
- [x] Every page has a browser tab title.
- [x] The Markdown renderer stays on the server: `pageHref` moves out of `lib/render/markdown.ts`, which becomes server-only.
- [x] Archive from the Projects page opens the danger zone with that project picked.

Next tier, not started: focus outlines and a skip link, search snippet cleanup, contrast misses, small tap targets, generated temp passwords, access wording on the 404.

Notes:

- Diagrams fit the column down to 75% of natural size, then scroll; Expand opens a native dialog that fits the diagram to the screen (never below 60%) and returns focus on close. The flowchart on the docs overview went from about 7px labels to 12px inline and full size in the dialog.
- The pages drawer is a native modal `<dialog>`; any open modal now locks page scroll (`html:has(dialog[open]:modal)`).
- Title template `%s · GitBasedDocs` in the root layout; the home page sets an absolute title because the template skips its own segment.
- `pageHref` lives in `lib/render/paths.ts`. Production build: no parse5, micromark, Shiki or hast in any chunk the doc page loads (205K of JS, uncompressed); the remaining KaTeX strings sit in Mermaid's lazy chunks.
- Archive links to `/admin/danger?archive=<slug>`, which opens that project's confirm with focus in the phrase box.

Also changed on the way: the width control became one button that cycles (Safi's call).
