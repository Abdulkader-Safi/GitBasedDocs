---
id: "markdown-extensions-2026-09-10"
status: "in-progress"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T15:30:00.000Z"
modified: "2026-09-10T15:30:00.000Z"
labels: ["viewer", "markdown"]
order: 26
---

# Markdown extensions

Safi asked for Mermaid and the other formatters writers expect, plus the best code highlighter. Research and ranking: `docs/research/06-markdown-extensions.md`.

Steps, one commit each:

- [x] Shiki code highlighting (replaces highlight.js): titles, `{1,3}` line ranges, `[!code ++]` diff marks, fallback for unknown languages.
- [x] Mermaid diagrams, loaded in the browser only on pages that have one, strict security, redrawn on theme change.
- [ ] KaTeX math, inline and block, rendered on the server.
- [ ] Obsidian callouts: all types, custom titles, folding.
- [ ] `==highlights==`, `%%comments%%` (also kept out of search), safe inline HTML.

Done when:

- [ ] Each extension has a case in `lib/render/markdown.check.ts`.
- [ ] A page using all of them renders in light and dark.
