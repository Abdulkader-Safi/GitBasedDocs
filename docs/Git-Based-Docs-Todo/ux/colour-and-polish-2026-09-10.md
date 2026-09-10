---
id: "colour-and-polish-2026-09-10"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-10T12:00:00.000Z"
modified: "2026-09-10T14:15:00.000Z"
labels: ["ux", "design-system"]
order: 25
---

# Colour and polish

Safi picked ink blue as the accent. Fonts and square corners stay.

- Ink blue accent token (about #2F5BD3 light, #7C9CF5 dark) for links, active nav, focus rings and primary buttons.
- One status badge style everywhere (outlined chip), replacing the solid green "Connected" block.
- Cooler dark mode greys (the stone greys read brown).
- 40px touch targets for icon buttons on touch screens.

Done when:

- [x] Accent passes WCAG AA contrast on both themes for text and buttons.
- [x] No page uses a solid status block.

Done before the reading card, since that card's links and sidebar marker use the accent.

What changed:

- `app/globals.css`: `--primary` and `--ring` are ink blue (oklch 0.52 0.18 264 light, 0.74 0.12 264 dark). Light keeps the warm paper greys; dark moved to cool slate (hue 265). Light status colours darkened a little to pass AA as small text. Measured contrast: blue text 5.6:1 light and 8.3:1 dark, button text 5.6:1 and 7.8:1, status text 4.8 to 5.1:1 light.
- One `Chip` in `components/ui/status-badge.tsx` (success, warning, danger, neutral, strong). The connection badge, sync run status, user role and status, access result, archived and draft labels all use it.
- `buttonVariants()` merges its classes itself. Links styled as outline buttons (Filter, Open, Archive) had lost their border because the base `border-transparent` won over `border-border`.
- Checkboxes use the accent.
- `pointer-coarse:` grows icon buttons, small buttons, the search button, the Admin link, the project switcher and the users actions menu to 40px on touch screens.
