---
id: "reader-home-project-cards-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T18:50:00.000Z"
modified: "2026-09-09T19:30:00.000Z"
labels: ["ui", "viewer"]
order: 20
---

# Reader home project cards

Replace the scaffold at `/` with the real project grid: top bar, "Projects" title, three column card grid on desktop and two at the 982px minimum. Each card shows name, description (two lines), and a mono meta line with page count and last update. Empty state reads "No projects shared with you yet. Contact your admin."

Admins see all active projects, viewers see linked ones only. Archived projects never appear.

Design: `docs/design/pages-theme-and-content.md` page 2, Figma frames `Reader home / 1512` and `Reader home / 982`.

Done when:

- [x] A viewer only sees projects they are linked to.
- [x] Page counts come from `doc_pages`, excluding deleted and draft rows.

Built: `lib/projects/reader.ts` (`listVisibleProjects`), `lib/format.ts` (`relativeTime`, `plural`), and the real `app/page.tsx`. Login moved onto the design system and gained a "Keep me logged in" checkbox.

Two bugs found and fixed while wiring it up:

- The page count subquery aliased `max(updated_at)` as `updated_at`, which SQLite rejected as ambiguous against `projects.updated_at`. Renamed to `last_updated`.
- `ThemeToggle` read `resolvedTheme` from a closure that was still `undefined` on first paint, so the first click always wrote "dark". It now reads the `dark` class off `<html>` at click time.

"Keep me logged in" is enforced server side: the cookie carries 30 days, and the session callback expires an unticked session after 12 hours, alongside the existing per-request user recheck.

Verified in the browser against the seeded dev database: three project cards with live page counts, correct in light and dark, theme toggle switching both ways.
