# Rendering Markdown in Next.js

## Input shape

Each doc file is Markdown or MDX with an optional header:

```md
---
title: "Connect the API"
order: 20
description: "How a client calls our API"
---
```

Body uses GitHub Flavored Markdown: headings, lists, tables, code fences, callouts, images with relative paths.

## Pipeline

1. Fetch raw body from GitHub blob or Contents API.
2. Parse header with `gray-matter`. Fill gaps: title falls back to first `#` heading, then to file name. Order falls back to 999.
3. Build a tree: project slug from folder name, page slug from file path, parent from folder nesting.
4. Render HTML on the server with `remark` plus `remark-gfm` for tables and task lists, then `rehype-slug`, `rehype-autolink-headings`, and `rehype-highlight` or `rehype-pretty-code` for code.
5. Sanitize HTML with `rehype-sanitize` before sending to the client. Raw HTML in Markdown is useful but must not allow script tags.
6. Rewrite relative image and link paths to cached routes under the project scope so private images do not leak through `raw.githubusercontent.com` URLs.
7. Store parsed title, headings, plain text excerpt, and rendered HTML hash in the index for nav and search.

## Nav and ordering

- Folder `docs/acme/` maps to project `acme`. File `docs/acme/api/auth.md` becomes page slug `api/auth`.
- Order rule: `order` in header first, then file name. Folders use `order` from an optional `_meta.json` or `index.md` header, then name.
- Draft rule: `draft: true` in header hides the page from readers but shows it to admins with a badge.

## MDX choice

Start with plain Markdown plus GFM. Add MDX only when a real page needs an interactive block. MDX adds build and sandbox cost. Most API and how to docs never need it.

## Images and files

- Relative `./images/login.png` resolves against the Markdown file folder in the repo.
- On sync, download the asset with the GitHub token, store by content hash, serve from `/api/assets/...` after an access check for that project.
- Never link readers straight to `raw.githubusercontent.com` for private repos. Those URLs need a token or expire and would leak paths.

## Caching

- Cache rendered HTML per file sha. Reuse until the sha changes.
- Cache the tree per head sha. Nav rebuilds only on new sync.
- Plain text excerpts feed search. Cap excerpt at about 2,000 chars per page.
