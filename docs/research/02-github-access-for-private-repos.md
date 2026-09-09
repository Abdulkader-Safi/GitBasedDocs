# GitHub access for private repos

## Goal

Read one private repo from a self hosted Next.js app with no workflow files and no deploy keys on the content repo side beyond a token. The app must list files and fetch file bodies through the API.

## Options compared

### Fine grained personal access token

A token tied to one user or bot account, limited to one repo with Contents read only and Metadata read only.

Good for this project because:

- Setup takes minutes in GitHub settings.
- Scope is one repo, read only.
- Works with Contents API, Trees API, blob API, and tarball download.
- No app install flow to build.

Limits:

- Tied to a user. If that user leaves, the token dies.
- Manual rotation unless we add a settings screen for it.
- Rate limit follows the user: 5,000 REST calls per hour.

Verdict: start here. It matches "connect with an API key and read one repo".

### GitHub App with install token

A small app installed on the repo with Contents read only. The server mints a short lived install token (expires in 1 hour) using a private key.

Good because:

- Not tied to a person.
- Short lived tokens, better audit trail.
- Higher rate limits for installs, cleaner revoke by uninstall.

Cost:

- More build work: app registration, install flow, key storage, token minting endpoint.
- Needs a public callback URL during install.

Verdict: phase two. Design the token store so the fetch layer accepts either a PAT or a minted install token.

### Deploy key or full git clone over SSH

A read only SSH key that clones the repo to disk and pulls on a timer.

Good for large repos and full history. Bad for this project because key handling on small hosts is fiddly, and per request access checks still need the API or a local tree parser anyway. Also harder to scope per project path without extra code.

Verdict: skip unless the repo grows past API limits.

### OAuth user tokens

Each reader logs in with GitHub and reads with their own token. This gives per user GitHub audit logs but forces every reader to have GitHub access to the private repo. That breaks the requirement: readers are clients without GitHub access.

Verdict: do not use for content reads. GitHub login can stay optional for admins, never for readers.

## APIs the app will use

With a fine grained PAT, these calls cover all reads:

- `GET /repos/{owner}/{repo}/contents/{path}`: list one folder or fetch one small file. Limit is 1,000 entries per folder and about 1 MB per file for full features. Fine for docs.
- `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1`: full file tree in one call. Use for sync and change detection.
- `GET /repos/{owner}/{repo}/git/blobs/{sha}`: fetch one file body by blob sha. Use when a file is over 1 MB or when batching fetches.
- `GET /repos/{owner}/{repo}/commits?path={path}&page={n}`: history for one page. Use for "last updated" labels.
- `GET /repos/{owner}/{repo}/tarball/{ref}`: full snapshot as fallback for first sync or rebuild.

Auth header on every call:

- `Authorization: Bearer <token>`
- `Accept: application/vnd.github+json`
- `X-GitHub-Api-Version: 2026-03-10`

## Rate and size notes

- Trees call with `recursive=1` counts as one call and returns up to 100,000 tree entries with truncation flags. Docs repos sit far below this.
- Cache `ETag` on Contents and Trees calls. On recheck, a `304 Not Modified` costs almost nothing against the limit.
- Store blob sha per path. Fetch a file body only when its sha changed.
- Keep file cap: warn over 1 MB, refuse render over 2 MB with a "file too large" page instead of crashing.

## Secrets handling

- Token lives only on the server. Never send it to the browser, never log it.
- Store encrypted at rest if the host DB supports it. At minimum store with restricted read and mask in UI (`ghp_...abcd` style mask is wrong for fine grained tokens, mask as `github_pat_...last4`).
- One global token for v1, stored in env or settings table. Per project tokens come later.
