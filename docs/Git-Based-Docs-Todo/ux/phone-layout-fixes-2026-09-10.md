---
id: "phone-layout-fixes-2026-09-10"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T12:00:00.000Z"
modified: "2026-09-10T12:30:00.000Z"
labels: ["ux", "mobile", "bug"]
order: 22
---

# Phone layout fixes

Found in the UX review at 400px wide.

- Doc page top bar: the product name is cut to "GitBasedDo" and the search button, project switcher and Admin link overlap. Below `sm` show the logo icon only, move the project switcher into the mobile drawer, and make Admin icon-only.
- Users table: it scrolls sideways, so role, status and the actions menu are off-screen. Below `md` show each user as a stacked row with the actions menu in reach.

Done when:

- [x] No overlap in the top bar at 360px and 400px on reader and admin pages.
- [x] Every user action is reachable at 400px without sideways scrolling.

What changed: below `sm` the wordmark and the Admin link are icon only, bar gaps tighten, and the project switcher truncates long names. Users show as a table from `lg` up and as stacked rows below. The table no longer sits in a scroll box, which also fixes the actions menu getting clipped inside a scrollbar on short lists. Checked at 360px and 1512px.
