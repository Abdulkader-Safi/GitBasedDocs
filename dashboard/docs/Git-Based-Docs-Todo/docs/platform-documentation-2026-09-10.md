---
id: "platform-documentation-2026-09-10"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-10T18:00:00.000Z"
modified: "2026-09-10T18:30:00.000Z"
labels: ["docs"]
order: 27
---

# Platform documentation

User and admin docs, written into the content vault at `/Users/safi/Documents/Docs/docs/GitBasedDocs/` so they publish through the app itself.

Pages (frontmatter `order` 1 to 11): overview, getting started, connect GitHub, projects, users and access, writing docs, Markdown guide, reading docs, admin guide, deploy, troubleshooting.

- Every fact checked against the code: token scopes, sync timing and backoff, size limits, roles, session lengths, password rules, danger zone phrases, GitHub error messages.
- Every page rendered through the real pipeline with the vault's file list: all wikilinks and heading links resolve.
- The Markdown guide doubles as a test page: code, diagram, math, callouts, highlights, comments, HTML, tables.

Found while writing, fixed in the app:

- Editors were promised drafts but only admins saw them. Now editors see drafts in pages and search.
- Files under dot folders (Obsidian's `.trash`) were published. Now skipped.

Left open: on phones the change-password page has no link (the email is hidden below `md`); the docs point to `/account/password`.

Not committed in the vault: Obsidian Git backs it up, and pushing it is what publishes it.
