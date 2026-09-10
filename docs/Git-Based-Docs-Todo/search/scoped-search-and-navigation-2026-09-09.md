---
id: "scoped-search-and-navigation-2026-09-09"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-10T12:00:00.000Z"
labels: ["search", "ui"]
order: 17
---

# Scoped search and navigation

Search scoped to one project: local index of title, headings, excerpt (about 2,000 chars per page), reindexed on blob change during sync. Command palette (`Cmd+K`, shadcn Dialog) on desktop, input above the drawer on mobile. Results show title, path trail, one snippet line. No global cross project search in v1.

Spec: `docs/features/07-search-and-navigation.md`.

Done when:

- [x] Query in project A never returns rows from project B.
- [x] Empty query shows recent pages in that project.
- [x] The search route goes through `requireProjectAccess`: a viewer searching a project they are not in gets the same 404 as pages and assets. (Moved here from the access card.)

Built:

- `lib/search/search.ts`. No separate index: page bodies are already stored at sync time, so a search is a `LIKE` query over title and full body, always filtered by project id. Every word must appear; title matches rank above body matches, and a title starting with the first word ranks highest. `%` and `_` are escaped, so "100%" means the characters. Queries are capped at 8 words and 200 characters. Snippets are one line of plain text around the first hit, cut on word boundaries. Drafts are searchable by admins only; deleted pages never.
- Empty query: the person's own most recently opened pages in that project, read from the access log, then the most recently updated pages to fill the list. Denied attempts never count as opened, and nobody sees anyone else's history.
- `GET /api/p/[projectSlug]/search`: the same gate and bare 404 as pages and assets, and denied searches go into the access log.
- `components/viewer/search-palette.tsx`: a native `<dialog>` for focus trapping, Escape and backdrop. Opens with Cmd+K or Ctrl+K, or `/` when not typing. Arrow keys move, Enter opens, the latest request wins so a slow reply cannot overwrite a newer one. Shows the project badge and "This project only", and bolds the typed words in each result.
- Opening a result adds `?q=`; the page marks every occurrence of the words in the article and scrolls to the first.

Deviation: the spec puts a separate search input above the mobile drawer. The same palette trigger sits in the top bar at every width (icon only when narrow), which covers mobile without a second input.

Checks: `lib/search/search.check.ts` on a throwaway DB (`DATABASE_URL=file:./data/search-check.db`) covers project isolation when another project holds a better match, ranking, all-terms matching, literal `%` and `_`, drafts, deleted pages, snippets, and recent pages from the log.

Verified in the browser against the vault: Cmd+K opened the palette on recent pages; "test" ranked the Test page first then the two pages that mention it, with snippets; arrows and Enter opened `/p/docs/docs/test?q=test` with four occurrences marked and the first in view. Over HTTP with a temporary viewer: 404 as a non-member and for a missing project, results once access was granted, and both denied searches in the access log. The test account was removed afterwards.
