---
id: "sidebar-and-mobile-drawer-2026-09-09"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T09:55:00.000Z"
labels: ["viewer", "ui"]
order: 15
---

# Sidebar and mobile drawer

Two pane layout with breadcrumb on top: sidebar tree from the index (folders as groups, `order` then name, active highlight), collapses to a drawer on mobile. Prev and next links at page bottom follow sidebar order. Dark mode kept from the theme provider. Print hides the sidebar.

Spec: `docs/features/04-doc-viewer.md`.

Done when:

- [x] Active page highlights on every nested route.
- [x] Code blocks show language label and copy button.

Built: `lib/viewer/tree.ts` (pure: `buildTree`, `flatten`, `neighbours`, `trail`, `openFolders`, `landingSlug`) with `lib/viewer/tree.check.ts`. A folder's own index page names and orders that folder and makes its label a link; folders without one get a humanised name. The project index always leads. Sort is `order`, then title with numeric compare, so "Page 9" comes before "Page 10".

`components/viewer/sidebar.tsx` renders folders as native `<details>`, so they open and close with no client JS; folders on the active path start open. The top bar is sticky, the sidebar sticks under it at the full remaining height, and heading anchors carry a scroll margin so they land below the bar.

Below `md` the sidebar moves into a drawer (`components/viewer/mobile-nav.tsx`), keyed on the path so it closes after every navigation without an effect. The project switcher is a native `<details>` dropdown. Print hides the top bar, sidebar, prev/next, copy buttons and heading anchors, and wraps code.

Verified in the browser at 1512: active row highlighted on `/p/docs/Welcome` and `/p/docs/docs/test`, breadcrumb and prev/next correct. At 408 px the drawer opens with the full tree and closes itself after tapping a page.

Not browser-verified yet: the copy button click, because the vault has no fenced code. The markup is covered by the renderer check.

Follow up (2026-09-10): with `docs/index.md` in the vault, the sidebar showed the folder as "Index" instead of "docs". Two causes, both fixed:

- An index page renamed its folder to the page's title. Folders now always keep their real name, the way Obsidian shows them; the index only makes the folder clickable and can set its order. Prev and next still use the index page's own title. `features/07` updated to match.
- An untitled `index.md` fell back to the file name, so its title was "Index". It now takes its folder's name (`docs/index.md` becomes "Docs"); a heading or frontmatter title still wins.

Verified against the vault: sidebar reads `docs` (opens the index) > `Test`, then `Welcome`, matching Obsidian.

