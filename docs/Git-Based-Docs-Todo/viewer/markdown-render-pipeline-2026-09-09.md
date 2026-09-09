---
id: "markdown-render-pipeline-2026-09-09"
status: "todo"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["viewer"]
order: 14
---

# Markdown render pipeline

Server side render: `gray-matter` header (title falls back to first `#`, then file name; order falls back to 999), `remark` plus `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, code highlight, `rehype-sanitize` before client. Rewrite relative links and images to in project routes. Cache HTML per blob sha. Cap: warn over 1 MB, refuse render over 2 MB with a "file too large" page.

Spec: `docs/features/04-doc-viewer.md`, `docs/research/04-rendering-markdown-in-nextjs.md`.

Done when:

- [ ] Script tags in Markdown never reach the client.
- [ ] Page header shows title, description, and "updated {date}".
