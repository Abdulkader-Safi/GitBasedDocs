---
id: "reading-experience-2026-09-10"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-10T12:00:00.000Z"
modified: "2026-09-10T15:00:00.000Z"
labels: ["ux", "viewer"]
order: 24
---

# Reading experience

- "On this page" outline in the empty right column on wide screens, built from h2 and h3, highlighting the heading in view.
- Links in the body visible at a glance (accent colour and underline).
- Stronger "you are here" in the sidebar: accent bar plus weight.
- Breadcrumb: no "Docs / Docs" on the landing page.
- "View on GitHub" link in the page meta line.
- Reader home: cards in a centred grid.
- Login: product name and logo above the card, taller inputs.

Done when:

- [x] A page with three or more headings shows an outline at 1280px and up.
- [x] Links can be told apart from body text without hovering.

What changed:

- `outline()` in `lib/render/markdown.ts` reads h2 and h3 from the rendered HTML (anchor text and tags stripped, entities decoded, duplicate ids kept). Checked in `markdown.check.ts`.
- `components/viewer/outline.tsx`: sticky "On this page" column from `xl` up when a page has two or more headings. The heading past the top third of the screen gets the blue marker. Verified on a throwaway page, then deleted.
- Links in the body are ink blue with a soft underline; heading anchors stay grey.
- Sidebar: current page and current folder index get a blue left bar plus weight.
- Breadcrumb lists ancestors only and is hidden on the project landing page (no more "Docs / Docs").
- "View on GitHub" in the meta line for admins and editors. Viewers do not get it, since the repo is private.
- Reader home centred at 1120px. Login shows the product mark, name and one line about it.
- Inputs are 36px to match buttons (40px on touch).
