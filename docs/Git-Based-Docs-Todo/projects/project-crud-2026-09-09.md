---
id: "project-crud-2026-09-09"
status: "done"
priority: "high"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T14:13:46.000Z"
labels: ["projects"]
order: 7
---

# Project CRUD

Admin list at `/admin/projects` (status, path, page count, last sync) plus create and edit form: name, slug (`^[a-z0-9-]{2,48}$`, unique, stable on rename), description, active flag. Archive sets `isActive=false`. Reader home `/` lists linked active projects only.

Spec: `docs/features/02-projects.md`.

Done when:

- [x] Duplicate slug or path is rejected with a plain message.
- [x] Archived project vanishes for viewers but stays restorable.

Notes: reader home list lands with the viewer task. Page count and last sync columns land with the sync task. Verified: slug, name, and escape validation reject in order.
