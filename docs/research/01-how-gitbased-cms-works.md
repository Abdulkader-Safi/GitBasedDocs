# How gitbased CMS tools work

## Plain definition

A gitbased CMS stores content as plain files in a git repo, usually Markdown or MDX with a small header block. The app reads those files and shows them as pages. History, review, and rollback come from git itself.

## Common loop

1. Writer edits a `.md` file on main or in a pull request.
2. The change is a normal commit with author, date, and message.
3. The app fetches the new file list and file bodies.
4. The app parses the header, builds nav, renders HTML.

There is no CMS database for content. The repo is the content store. The app may keep a local copy or index for speed, but the repo wins on conflict.

## Two main shapes

### Files read at build time

Tools like Nextra, Contentlayer, Fumadocs, and `nextjs-github-markdown-blog` pull Markdown into the Next.js build. This is simple and fast. The weak point: new commits need a rebuild or a new fetch before readers see them.

### Files read at request time

Tools like Outstatic in API mode, Tina in data layer mode, and custom docs apps call the GitHub API when a reader opens a page. This fits private per client docs because access checks run per request and fresh commits show up without a deploy.

This project needs the second shape. Readers log in, the app checks which projects they may open, then it reads only those paths.

## What standard tools do well

- Frontmatter for title, order, description, tags.
- Folder based nav: `project-a/getting-started.md` becomes a section and a page.
- `_meta` or index files to set page order and labels.
- Markdown plus callouts, code blocks, tables, images with relative paths.

## What standard tools skip

Most open source git CMS setups assume one public site and one set of readers. They do not include:

- Login per reader.
- More than one client project on the same install.
- Rules like "user A sees project A, user B sees project B".
- Token handling for a private org repo.

That is why this project wraps a normal Markdown pipeline with auth, projects, and per project path rules.

## Terms used in these notes

- Content repo: the single private GitHub repo that holds all docs.
- Project: one client or software product inside the app. Maps to one folder in the content repo.
- Sync: the app fetching the file tree and changed file bodies from GitHub.
- Index: rows in our own DB that list paths, titles, hashes, and sync state. Used for nav and search.
