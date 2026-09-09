---
id: "webhook-endpoint-2026-09-09"
status: "todo"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["sync"]
order: 10
---

# Webhook endpoint

`POST /api/webhooks/github`: verify `X-Hub-Signature-256` first, accept only `push` to the tracked branch, reply 200 fast, queue delta sync in background. Store `X-GitHub-Delivery` id and skip repeats. Optional for hosts with no public URL.

Spec: `docs/features/06-sync-and-cache.md`, `docs/research/03-sync-without-github-actions.md`.

Done when:

- [ ] Bad signature returns 401 with no sync and a logged delivery id.
- [ ] Push to another branch returns 200 with a log line and no sync.
