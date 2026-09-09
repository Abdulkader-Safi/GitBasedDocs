---
id: "repo-path-mapping-2026-09-09"
status: "todo"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["projects"]
order: 8
---

# Repo path mapping

Each project maps to one folder under the connection docs root (for example `docs/acme`). Path picker reads from the last synced tree. Save blocked when the folder is missing. Reject `../` and absolute paths. Paths unique across projects.

Spec: `docs/features/02-projects.md`.

Done when:

- [ ] Saving a project with a missing folder shows "folder not found in repo".
- [ ] Two projects cannot share one folder.
