---
id: "token-storage-and-status-2026-09-09"
status: "todo"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["github", "security"]
order: 6
---

# Token storage and status

Store the token server side only (env or encrypted DB field, pick one per deploy and note it in settings). Mask after save, empty edit keeps the old token. Status badge: connected, syncing, error with last message. Token never reaches the browser or logs.

Spec: `docs/features/03-github-connection.md`, `docs/research/02-github-access-for-private-repos.md`.

Done when:

- [ ] Saved token renders masked in UI and API responses.
- [ ] Revoked token flips status to error and shows an admin banner.
