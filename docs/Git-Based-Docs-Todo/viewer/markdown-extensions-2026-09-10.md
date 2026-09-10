---
id: "markdown-extensions-2026-09-10"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-10T15:30:00.000Z"
modified: "2026-09-10T17:30:00.000Z"
labels: ["viewer", "markdown"]
order: 26
---

# Markdown extensions

Safi asked for Mermaid and the other formatters writers expect, plus the best code highlighter. Research and ranking: `docs/research/06-markdown-extensions.md`.

Steps, one commit each:

- [x] Shiki code highlighting (replaces highlight.js): titles, `{1,3}` line ranges, `[!code ++]` diff marks, fallback for unknown languages.
- [x] Mermaid diagrams, loaded in the browser only on pages that have one, strict security, redrawn on theme change.
- [x] KaTeX math, inline and block, rendered on the server.
- [x] Obsidian callouts: all types, custom titles, folding.
- [x] `==highlights==`, `%%comments%%` (also kept out of search), safe inline HTML.

Done when:

- [x] Each extension has a case in `lib/render/markdown.check.ts`.
- [x] A page using all of them renders in light and dark.

Notes:

- Shiki grammars load on first use (cold 73 ms, then about 1 ms a block); `github-dark-default` on our own code surface.
- Mermaid checks syntax with `mermaid.parse` first and runs with `suppressErrorRendering`, so a broken diagram shows its source and the error, and nothing lands at the bottom of the page.
- remark-math would read "$5 a month, or $50" as a formula; `remarkDollarGuard` applies the Obsidian and Pandoc rule (no space inside the dollars, no digit after the closing one).
- rehype-raw drops fence meta, so the meta is parked in a `data-meta` attribute across raw and sanitize and restored after.
- Comments are stripped at sync, so they never reach the database or search. Migration 0008 cleared blob shas so existing pages were re-fetched; confirmed after restart.
- Tables now sit in a `.table-wrap` scroll box so they fill the column. Render cache is keyed by `RENDER_VERSION` so old HTML is never served after a pipeline change.
