# 02 Projects

## Purpose

Group docs per client or product so each reader sees only their own work. A project maps to one folder in the content repo.

## Users

- Admin: creates, edits, archives projects.
- Viewer: opens projects linked to their account.

## Behavior

- Project fields: name, slug (lowercase, dashes), repo path (for example `docs/acme`), description, active flag.
- Slug is unique and stable. Rename of name keeps slug unless admin edits it with a warning that links change.
- Repo path is unique across projects. Two projects must not point at the same folder.
- Archive sets `isActive=false`. Archived projects vanish from viewer lists but stay in DB with their index rows for restore.
- Delete is soft for v1: archive only. Hard delete with index purge is a typed confirm action reserved for later.
- Reader home `/` lists only linked active projects with name, description, and updated date.

## Data

- `projects` table plus `project_members` join table (userId, projectId, unique pair).
- `doc_pages.projectId` links every page to one project. Queries always filter by projectId after the access check.

## UI

- Admin list at `/admin/projects` with status, path, page count, last sync.
- Create and edit form with slug auto suggest from name and path picker from the fetched repo tree.
- Reader cards on home. Empty state: "No projects shared with you yet. Contact your admin."

## Rules

- Path must exist in the last synced tree before save, else block with "folder not found in repo".
- Path is a folder inside the repo, or empty for the repo root. Reject `../` or absolute paths. When `docsRoot` is set it also has to sit under it.
- Slug pattern: `^[a-z0-9-]{2,48}$`.

## Out of scope for v1

- Per project tokens, per project branches, project level webhooks. One repo link serves all projects.
