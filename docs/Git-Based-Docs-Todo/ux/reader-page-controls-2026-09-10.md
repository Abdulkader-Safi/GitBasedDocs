---
id: "reader-page-controls-2026-09-10"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T18:45:00.000Z"
modified: "2026-09-10T19:30:00.000Z"
labels: ["ux", "viewer"]
order: 28
---

# Reader page controls

Safi asked for these on doc pages:

- [x] **Page width**: one icon in the top bar that opens three widths, Narrow (today's 672px column), Wide and Full. Remembered per reader and applied before first paint, so the page never jumps.
- [x] **Outline as a right sidebar**: "On this page" becomes a full-height panel on the right, bordered like the left sidebar, with an icon to hide it and one to bring it back. Remembered per reader.
- [x] **Smooth scroll**: clicking a title in the outline (or any `#` link on the page) scrolls there smoothly instead of jumping. Readers who ask their system for reduced motion still jump.

Done when:

- [x] Each width works with and without the outline, from 1024px up, light and dark.
- [x] Hiding the outline gives its space back to the page.
- [x] Nothing flashes at the old width or with the old panel state on reload.

What shipped:

- `components/viewer/page-controls.tsx`: `PageWidthMenu` (icon shows the current width; menu of Narrow 42rem, Wide 64rem, Full) and `OutlineToggle`, both on one small store over `<html>` data attributes plus localStorage.
- `lib/viewer/prefs.ts` + a script in `<head>` (app/layout.tsx) apply both before first paint; checked on reload that the first frame already has the stored values.
- Right panel on doc pages from `xl` up, bordered like the left sidebar, with a hide button in its header and a show/hide toggle in the top bar.
- `scroll-behavior: smooth` under `prefers-reduced-motion: no-preference`, with `data-scroll-behavior="smooth"` so Next does not animate route changes. A clicked outline title stays marked during the scroll, and the last heading is marked at the bottom of the page.
- The width and panel rules are unlayered CSS: inside `@layer components` they lost to the `xl:flex` utility.
