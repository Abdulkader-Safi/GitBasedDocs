# Platform design spec

Build this in Figma first, then we match the code to it. Every page the app needs, what goes on it, and the exact theme tokens from `dashboard/app/globals.css`. Code values win if anything here disagrees with that file.

## Theme tokens

### Color roles

Use these roles, never raw hex, so light and dark mode stay in sync.

Light mode:

- Background `#ffffff`, foreground `#1c1917` (near black, warm).
- Card `#ffffff`, card foreground `#1c1917`.
- Primary `#1c1917` (near black buttons), primary foreground `#faf9f7` (off white text).
- Secondary, muted, accent: `#f5f4f3` surfaces with `#1c1917` text.
- Muted foreground (secondary text): `#78716c`.
- Border and input: `#e7e5e4`.
- Destructive (errors, danger zone): `#dc2626`, white text on it.
- Sidebar: `#faf9f7` background, `#1c1917` text, `#f5f4f3` hover.

Dark mode:

- Background `#1c1917`, foreground `#faf9f7`.
- Card `#292524`, card foreground `#faf9f7`.
- Primary flips to `#e7e5e4` (light buttons) with `#1c1917` text.
- Secondary, muted, accent: `#292524` with `#faf9f7` text.
- Muted foreground: `#a8a29e`.
- Border: white at 10 percent. Input: white at 15 percent.
- Destructive: `#f87171`.
- Sidebar: `#292524` background, `#faf9f7` text.

### Shape and space

- Radius is `0`. Every corner is sharp: cards, buttons, inputs, badges, dialogs. This is the strongest visual trait, keep it everywhere.
- Base spacing unit is 4px. Page padding is 24px desktop, 16px mobile. Card padding is 24px. Gaps between stacked blocks are 16px.
- Content column max width: 672px for prose, 896px for admin forms, full width for tables.

### Fonts

Three faces, loaded in `dashboard/app/layout.tsx`:

- Body and UI: Geist (sans). Weights 400 regular, 500 medium.
- Headings: Merriweather (serif). Page titles 24px semibold, section titles 18px medium, card titles 16px medium.
- Code, labels, and small meta text: JetBrains Mono. Code blocks 13px, meta lines 12px, uppercase micro labels 11px with letter spacing.

Note: the global stylesheet sets mono as the base html font, so small UI text already renders in JetBrains Mono. Body prose inside doc pages renders in Geist.

### Icons

Remix icons only (`@remixicon/react` in code). Outline style, 16px in buttons and nav, 20px in empty states. No emojis anywhere in UI.

### Light and dark

Design every frame twice, light then dark. Theme toggle lives in the top bar on every page. Persist choice per browser.

### Frames to set up

Desktop 1440px, tablet 768px, mobile 375px. One frame per page per breakpoint for the five reader pages, desktop plus mobile for admin pages.

## Global chrome

### Top bar (all pages except login)

- Left: product mark plus project switcher (reader) or "Admin" label (admin pages).
- Center or right: search trigger button showing a magnifier icon and `Cmd+K` hint (reader pages only).
- Right: theme toggle, user email or avatar menu with sign out.
- Height 56px, bottom border 1px.

### Error banner (admin pages only)

- Full width strip above content, destructive background, white text.
- Shows while the GitHub connection status is error. Text pattern: `GitHub: <last error message>`.
- Hidden otherwise.

## Page 1: Login (`/login`)

Purpose: the only public page. Everyone starts here.

Layout:

- Centered card, max width 384px, on plain background. No top bar.
- Card title: "Sign in". No logo above the card in v1, keep it plain.
- Email field (label "Email", type email, autocomplete email).
- Password field (label "Password", type password with Show and Hide toggle button on the right, autocomplete current-password).
- Primary button "Sign in", full width. Loading state text "Signing in..." with button disabled.
- Error line in destructive color under the fields: "Email or password is wrong." Same text for every failure.
- Helper line under the button: "No account yet? Contact your admin." No signup link in v1.

States: default, loading, error. No illustration.

## Page 2: Reader home (`/`)

Purpose: signed in reader lands here and picks a project.

Layout:

- Top bar with search trigger, theme toggle, user menu.
- Page title "Projects" 24px serif.
- Card grid, 3 columns desktop, 1 column mobile. Each card shows project name (16px medium), description (14px muted, 2 lines max), and meta line in mono 12px: `Updated <date> · <page count> pages`.
- Empty state card: "No projects shared with you yet. Contact your admin." Centered, muted.
- Admins see all active projects. Viewers see linked ones only. Archived projects never appear here.

## Page 3: Project landing (`/p/{projectSlug}`)

Purpose: entry point per project. Shows the index page content if the repo has an `index.md` at the project root, else the first page by sort order.

Layout: same shell as the doc page below, content area shows that page. Breadcrumb shows project name only.

## Page 4: Doc page (`/p/{projectSlug}/[...pageSlug]`)

Purpose: the daily reading screen. Design time here matters most.

Layout:

- Left sidebar 280px fixed on desktop, drawer on mobile with hamburger in the top bar. Sidebar sections: project name header, search field (mobile only, above tree), tree of folders and pages, footer with "Back to projects" link.
- Tree rows: 14px, folder labels medium with chevron, page rows regular with 12px left indent per level. Active page row uses accent background plus medium weight. Draft pages never appear for viewers.
- Center content column max 672px: breadcrumb (project plus folder trail plus page title, 13px muted with slashes), title 24px serif, description 15px muted, meta line mono 12px muted: `Updated <date>`.
- Body prose 15 to 16px Geist with generous line height. Elements to design: h2 and h3 with anchor link on hover, paragraphs, bulleted and numbered lists, task list checkboxes, tables (header row muted background, 1px borders, horizontal scroll on mobile), fenced code blocks (dark fill in both modes, language label top right mono 11px, copy button with copied check feedback), inline code (accent fill, mono 13px), callouts for note, tip, warning (left border 3px, tinted fill, bold label), images with caption style, horizontal rules.
- Bottom: prev and next links in two columns ("Previous: title" left, "Next: title" right).
- Right side: nothing in v1. No table of contents column.

States: loading skeleton (sidebar rows plus title plus paragraph bars), missing page (title "Page not found" plus links to search and project home), file too large (title plus "This file is too large to render."), stale content note for admins only when a file failed to sync: small muted line "Showing last good copy."

Print: sidebar and top bar hidden, code wraps.

## Page 5: Search (palette plus results)

Purpose: find a page inside the current project. Never cross project.

Layout:

- Trigger: top bar button with magnifier plus `Cmd+K` kbd hint. Mobile: full width input above the sidebar drawer.
- Dialog: centered, max width 560px, sharp corners. Input row with magnifier, result list below.
- Each result: title 14px medium, path trail 12px muted, one snippet line 13px with query term in medium weight.
- Project badge at the top of the dialog: current project name, 11px uppercase mono.
- Empty query: "Recent pages" list for that project. No match: "No results in this project."

## Page 6: Admin home (`/admin`)

Purpose: launchpad with status at a glance.

Layout:

- Title "Admin" 24px serif.
- Cards in one column max 896px: GitHub connection (status badge plus link), Projects (count plus link), Users (count plus link, later task), Sync runs (last run time plus status plus link, later task).
- Status badge component: pill with dot. Connected is green fill, syncing is amber, error is destructive. Text 12px medium.

## Page 7: GitHub connection (`/admin/connection`)

Purpose: link the private repo and prove reads work.

Layout:

- Card "GitHub connection" with status in the title row.
- Four inputs in two columns: Owner (placeholder octocat), Repo (placeholder docs), Branch (placeholder main), Subfolder (optional, placeholder "whole repo").
- Note under fields, 12px muted: "Token and webhook secret come from env (GITHUB_TOKEN, GITHUB_WEBHOOK_SECRET). They never appear here."
- Buttons row: primary "Save", outline "Test connection". Loading state "Working..." disables both.
- Results list under buttons: one row per check with green check or red cross icon, name medium, message regular. The three checks read: token identity, branch plus short sha, Markdown file count in the repo.
- Error text in destructive under the buttons on save failure.

## Page 8: Projects (`/admin/projects`)

Purpose: create projects and archive them.

Layout:

- Card "New project": name plus slug auto suggest in two columns (typing the name fills the slug, slug stays editable), repo path full width (placeholder docs/acme), description full width. Primary button "Create project". Error line in destructive.
- Card "Projects (n)": rows with name medium, `/slug · repoPath` muted mono 12px, archived tag when inactive. Right side outline button Archive or Restore per row.
- Empty state: "No projects yet."

## Page 9: Users (`/admin/users`, later task)

Purpose: manage accounts and project access.

Layout:

- Button "New user" top right.
- Table columns: name, email, role badge (admin, editor, viewer), status (active or deactivated), projects count, last login. Row actions menu: edit role, reset password, revoke sessions, deactivate.
- Create and edit dialog: name, email, password with show toggle, role select, project checkboxes list.
- Deactivated rows render at reduced opacity.

## Page 10: Sync runs (`/admin/sync`, later task)

Purpose: see what each sync did.

Layout:

- Button "Sync now" top right with running state.
- Table columns: trigger (webhook, manual, cron), head sha mono short 7 chars, added, changed, removed counts, duration, status badge, time. Expandable row shows error text and failed paths in mono 12px.
- Last 50 runs, newest first.

## Page 11: Not found (all bad slugs)

Purpose: same 404 for missing pages and for projects the reader may not open.

Layout: centered. Title "Page not found" serif 24px. Copy: "This page does not exist or was moved." Buttons: "Search" (opens palette) and "All projects" (home). No hint about which projects exist.

## Copy deck (exact strings)

- Login error: "Email or password is wrong."
- No access home: "No projects shared with you yet. Contact your admin."
- Missing folder on project save: "Folder not found in repo."
- Duplicate project: "Slug or path is already used by another project."
- Bad slug: "Slug must be 2-48 chars of lowercase letters, numbers, dashes."
- Empty projects admin: "No projects yet."
- File too large: "This file is too large to render."
- Token rejected: "Token rejected. Check Contents read scope and repo access."
- Repo missing: "Not found with this token. Check owner, repo, and branch."
- Rate limited: "Rate limited. Wait a minute and retry."

## What not to design yet

Comments, page ratings, PDF export, per commit version picker, public share links, billing, email invites, MDX interactive blocks. If it is not on this list, it is out of v1.
