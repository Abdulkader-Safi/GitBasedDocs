# 03 GitHub connection

## Purpose

Link the app to one private repo and prove reads work, with no workflow files added to that repo.

## Users

- Admin only.

## Behavior

- Form fields: owner, repo, branch (default `main`), subfolder (optional, empty means the whole repo), token, webhook secret optional.
- "Test connection" runs three checks and shows each result: auth works, repo and branch found, the repo holds at least one `.md` file.
- Save stores the link and runs a first full sync in the background with progress state: queued, running, done, error.
- Token display is masked after save. Re entry replaces it. Empty field on edit keeps the old token.
- Connection status badge: connected, syncing, error with last message. Error banner also shows to admins on all admin pages until fixed.

## Data

- `repo_connections` single active row: owner, repo, branch, docsRoot, token ref, webhook secret ref, lastSyncedSha, status, lastCheckedAt, lastError.
- Token stored in env for simplest self host, or in DB behind app level encrypt. Pick one per deploy and note it in settings. Never both.

## API use

- Headers on each call: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2026-03-10`.
- Markdown count walks `GET /repos/{owner}/{repo}/git/trees/{headSha}?recursive=1` so nested pages count too.
- Head sha path uses `GET /repos/{owner}/{repo}/git/refs/heads/{branch}`.

## Edge cases

- Wrong token: 401 from GitHub becomes "token rejected, check scope (Contents read) and repo access".
- Repo renamed or moved: 404 becomes "repo not found with this token".
- Repo with no Markdown: warn, allow save, show "no pages yet" in projects.

## Out of scope for v1

- GitHub App install flow, multi repo links, write back to GitHub from the app.
