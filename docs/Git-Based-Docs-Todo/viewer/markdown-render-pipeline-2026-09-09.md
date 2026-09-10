---
id: "markdown-render-pipeline-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T09:20:00.000Z"
labels: ["viewer"]
order: 14
---

# Markdown render pipeline

Server side render: `gray-matter` header (title falls back to first `#`, then file name; order falls back to 999), `remark` plus `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, code highlight, `rehype-sanitize` before client. Rewrite relative links and images to in project routes. Cache HTML per blob sha. Cap: warn over 1 MB, refuse render over 2 MB with a "file too large" page.

Spec: `docs/features/04-doc-viewer.md`, `docs/research/04-rendering-markdown-in-nextjs.md`.

Done when:

- [x] Script tags in Markdown never reach the client.
- [x] Page header shows title, description, and "updated {date}".

Built: `lib/render/markdown.ts`. remark-parse, remark-gfm, remark-rehype (raw HTML dropped), rehype-sanitize, then trusted transforms only: slug, autolink headings, highlight, wikilinks, callouts, code blocks, link rewriting. Added `remark-rehype` and `rehype-stringify` (the Markdown to HTML bridge the rehype plugins need) and declared `unist-util-visit`, `github-slugger`, `@types/hast` directly since the renderer imports them.

- Relative links resolve to in-project routes; a link that climbs out of the project loses its href instead of pointing at another project. External links get `target="_blank" rel="noreferrer noopener"`.
- Images rewrite to `/api/assets/{project}/{path}`, the route the asset cache card will add. Until then relative images do not load.
- `> [!NOTE]`, `[!TIP]`, `[!WARNING]` (and `IMPORTANT`, `CAUTION`) become callouts.
- Fenced code gets the dark block, language label and a copy button, wired by one delegated listener in `components/viewer/article.tsx`.
- Obsidian wikilinks, not in the spec: the connected repo is an Obsidian vault and `Welcome.md` uses them. `[[page]]`, `[[page|label]]`, `[[page#Heading]]` resolve by file name like Obsidian; unknown targets render dimmed.
- Page names with spaces (`My Note.md`) produce encoded, working URLs.
- Over 2 MB shows "This file is too large to render." The sync now indexes oversized files with an empty body instead of skipping them, so they reach that page rather than a 404. Over 1 MB logs a warning.
- HTML is cached in process, keyed on page id, blob sha, a project generation (page count plus newest update) and role, so an unresolved wikilink re-renders once its target appears.

"Updated" is the time the sync last saw the file change, not the commit date. The commit date needs an extra API call per file; revisit if readers need it.

Verified: `lib/render/markdown.check.ts` covers seven injection vectors (script, inline handlers, `javascript:` in HTML and Markdown links, iframe), plus links, images, wikilinks, callouts, code blocks, headings and GFM.
