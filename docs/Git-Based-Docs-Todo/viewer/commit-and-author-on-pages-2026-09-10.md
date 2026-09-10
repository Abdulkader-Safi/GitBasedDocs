---
id: "commit-and-author-on-pages-2026-09-10"
status: "todo"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-10T19:45:00.000Z"
modified: "2026-09-10T19:45:00.000Z"
labels: ["viewer", "sync"]
order: 30
---

# Commit and author on pages

Safi wants readers to see more of Git. Under each page title: "Updated 3 minutes ago by Safi · f5e132e", where the commit links to GitHub for admins and editors.

- [ ] Sync asks GitHub for the last commit touching each changed file (one extra call per changed page) and stores its sha, author name and date.
- [ ] The page meta line shows author and short sha; the time comes from the commit, not the sync.
- [ ] Viewers see the author and time but no link, since the repo is private.
