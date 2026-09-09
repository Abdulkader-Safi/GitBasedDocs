---
id: "scoped-search-and-navigation-2026-09-09"
status: "todo"
priority: "medium"
assignee: "safi"
dueDate: null
created: "2026-09-09T11:36:01.000Z"
modified: "2026-09-09T11:36:01.000Z"
labels: ["search", "ui"]
order: 17
---

# Scoped search and navigation

Search scoped to one project: local index of title, headings, excerpt (about 2,000 chars per page), reindexed on blob change during sync. Command palette (`Cmd+K`, shadcn Dialog) on desktop, input above the drawer on mobile. Results show title, path trail, one snippet line. No global cross project search in v1.

Spec: `docs/features/07-search-and-navigation.md`.

Done when:

- [ ] Query in project A never returns rows from project B.
- [ ] Empty query shows recent pages in that project.
