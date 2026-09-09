# Feature map

Each file below is a build spec. It states who uses it, how it behaves, which data it touches, and what is out of scope for v1.

- `01-authentication.md`: sign in, sign out, sessions, password rules.
- `02-projects.md`: create projects, map each to a repo folder, archive.
- `03-github-connection.md`: connect one private repo with a token, test it, track head sha.
- `04-doc-viewer.md`: sidebar, page render, code blocks, images, last updated.
- `05-access-control.md`: who sees which project, invite and remove flow, no leak rules.
- `06-sync-and-cache.md`: webhook, manual sync, timed recheck, index and asset cache.
- `07-search-and-navigation.md`: sidebar order, breadcrumbs, scoped search.
- `08-admin-settings.md`: users list, sync log, danger actions, env and deploy notes.

Build order: 01, 03, 02, 06, 04, 05, 07, 08.
