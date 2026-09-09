---
id: "manual-sync-and-timed-recheck-2026-09-09"
status: "todo"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["sync"]
order: 11
---

# Manual sync and timed recheck

"Sync now" button per connection with run log, plus timed recheck every 5 to 15 minutes comparing remote head sha to stored sha. Back off on 403 or 429 (1 min, then 5 min), then surface an alert on settings.

Spec: `docs/features/06-sync-and-cache.md`.

Done when:

- [ ] Manual sync shows queued, running, done, error states.
- [ ] Timed recheck with no change costs one cheap call.
