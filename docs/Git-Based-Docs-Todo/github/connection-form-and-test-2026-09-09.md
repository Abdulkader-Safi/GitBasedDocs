---
id: "connection-form-and-test-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T20:05:00.000Z"
labels: ["github"]
order: 5
---

# GitHub connection form and test

Admin form for owner, repo, branch (default `main`), docs root (default `docs`), token, optional webhook secret. "Test connection" runs three checks: auth works, repo plus branch found, docs root lists at least one `.md` file.

Spec: `docs/features/03-github-connection.md`. Headers: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2026-03-10`.

Done when:

- [x] Each check shows pass or fail with a plain message (401 maps to scope hint, 404 to repo hint).
- [x] Save kicks off the first full sync as a background job with progress state.

Notes: sync kickoff lands with the sync engine task. Verified: bogus cookie 401s, empty input rejected, owner/repo/branch/docsRoot normalized.

Follow up (design pass): the screen is now on the design system, and saving gives real feedback. Before this it wrote the row correctly but nothing on screen changed, so a successful save looked like a no-op.

- Save confirms with "Saved owner/repo on branch" and re-renders from the server response.
- The status chip reads "Not tested yet" until a check has actually run, instead of showing a stale "connected".
- Retargeting owner, repo or branch now clears `lastSyncedSha`, `lastCheckedAt` and `lastError` in `saveConnection`. Keeping the old head sha let the next sync compare against a commit from a different repo.
- The webhook URL is built from the request headers (`x-forwarded-host` / `x-forwarded-proto`), so it is correct behind a Tailscale or ngrok proxy rather than printing localhost.
