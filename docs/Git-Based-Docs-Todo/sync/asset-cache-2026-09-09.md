---
id: "asset-cache-2026-09-09"
status: "todo"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["sync"]
order: 12
---

# Asset cache

On sync, download images and attachments under mapped folders with the GitHub token, store by content hash, serve from `/api/assets/...` behind the project access check. Never link readers to `raw.githubusercontent.com`.

Spec: `docs/features/06-sync-and-cache.md`, `docs/research/04-rendering-markdown-in-nextjs.md`.

Done when:

- [ ] Relative image paths in Markdown resolve to cached routes.
- [ ] Missing asset shows an alt box, never a token URL.
