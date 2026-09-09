# 05 Access control

## Purpose

Guarantee a client sees only their own projects. This is the core promise of the product.

## Model

- Roles: admin (all), editor (preview plus sync, no user or token screens), viewer (linked projects only).
- Access rows in `project_members`. No row means no access. Admin bypass is the single exception and lives in one helper.

## Behavior

- One helper `requireProjectAccess(userId, projectSlug)` used by pages, asset routes, search routes, and history routes. No inline checks elsewhere.
- Invite flow is admin only: pick user, pick project, save row. No invite email in v1. Admin shares login details out of band.
- Remove flow deletes the row at once. Active sessions for that user lose the project on next request because checks run per request.
- Deactivate user blocks login and all reads. Keep rows for audit.
- Every denied read returns 404, never 403, so slugs and titles do not leak through status codes.
- Logs: record project open and denied attempts with user, project, path, time. Admin can filter the last 500 events.

## Data

- `project_members(userId, projectId)` unique pair, plus `addedBy` and `createdAt`.
- Index queries always include `where projectId = X` after the check. Search, assets, and related pages follow the same rule.

## Tests to write before build passes

- Viewer A linked to project A cannot open project B page, asset, or search in B. All return 404.
- Removed member loses access on next request without sign out.
- Inactive project returns 404 even for linked viewers.
- Admin sees all, editor sees preview but no settings screens.

## Out of scope for v1

- Page level permissions inside a project, public share links, team level groups.
