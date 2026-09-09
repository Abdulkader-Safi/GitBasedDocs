---
id: "webhook-endpoint-2026-09-09"
status: "done"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T20:40:00.000Z"
labels: ["sync"]
order: 10
---

# Webhook endpoint

`POST /api/webhooks/github`: verify `X-Hub-Signature-256` first, accept only `push` to the tracked branch, reply 200 fast, queue delta sync in background. Store `X-GitHub-Delivery` id and skip repeats. Optional for hosts with no public URL.

Spec: `docs/features/06-sync-and-cache.md`, `docs/research/03-sync-without-github-actions.md`.

Done when:

- [x] Bad signature returns 401 with no sync and a logged delivery id.
- [x] Push to another branch returns 200 with a log line and no sync.

Built: `app/api/webhooks/github/route.ts` plus `lib/github/webhook.ts` (`verifySignature`, `refMatchesBranch`, `isRepeatDelivery`). Checks in `lib/github/webhook.check.ts`, run with `bun lib/github/webhook.check.ts`.

The signature is compared with `timingSafeEqual` after a length guard, so the endpoint cannot be used as an oracle for the secret. The sync runs in `after()` from `next/server`, so GitHub gets its 200 straight away instead of waiting out the tree walk.

Found and fixed while testing: `proxy.ts` redirected the webhook to `/login`, because the cookie gate had no exemption for it. GitHub sends no cookie, so every delivery would have been swallowed by a redirect in production. The route authenticates with the HMAC signature instead, and `/api/webhooks/` is now exempt.

Verified over HTTP against the running server:

| Case | Result |
| --- | --- |
| Bad signature | 401 `{"error":"Bad signature"}` |
| No signature header | 401 `{"error":"Bad signature"}` |
| `ping` event | 200 `{"pong":true}` |
| Push to `feature-x` | 200 `{"skipped":"branch"}` |
| `issues` event | 200 `{"skipped":"event"}` |
| Push to `main` | 200 `{"queued":true}` |
| Same delivery id twice | 200 `{"skipped":"duplicate"}` |

The queued run landed in `sync_logs` as `webhook sha=67caeac +0/~0/-0 1242ms`, stopping on the head sha check as expected.

Webhook URL for this host: `https://safis-macbook-pro.tail0b6830.ts.net/api/webhooks/github`, content type application/json, secret `GITHUB_WEBHOOK_SECRET`, push events only.
