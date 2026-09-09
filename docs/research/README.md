# Research index

Short map of what each note covers and the main takeaway.

- `01-how-gitbased-cms-works.md`: repo is the source of truth, app reads files and renders them. Takeaway: keep editing in git, keep rendering in the app.
- `02-github-access-for-private-repos.md`: fine grained PAT scoped to one repo is the fastest safe start. Takeaway: use PAT first, move to GitHub App later if rotation or install control matters.
- `03-sync-without-github-actions.md`: read with Contents and Trees APIs plus webhooks and timed recheck. Takeaway: no workflow files in the content repo, the app pulls on its own schedule.
- `04-rendering-markdown-in-nextjs.md`: parse frontmatter, keep an index in the DB, render with remark and rehype. Takeaway: store a tree and HTML cache, never raw API output as UI.
- `05-auth-data-and-multitenancy.md`: Auth.js with Drizzle, one login, access per project. Takeaway: users see only projects linked to their account.
