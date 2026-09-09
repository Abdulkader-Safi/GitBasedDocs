import { and, eq, sql } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { docPages, projectMembers, projects } from "@/lib/db/schema"

export interface ReaderProject {
  id: string
  slug: string
  name: string
  description: string
  pageCount: number
  updatedAt: Date | null
}

// Projects this account may open. Admins see every active project, everyone
// else sees the ones they are linked to. Archived projects never appear.
export async function listVisibleProjects(
  userId: string,
  role: string,
): Promise<ReaderProject[]> {
  const db = await getDb()

  // Live pages only: deleted rows are kept for restore hints and drafts are
  // invisible to readers, so neither belongs in the count.
  const counts = db
    .select({
      projectId: docPages.projectId,
      pageCount: sql<number>`count(*)`.as("page_count"),
      // Distinct alias: a bare "updated_at" collides with projects.updated_at
      // and SQLite rejects the join as ambiguous.
      lastUpdated: sql<number>`max(${docPages.updatedAt})`.as("last_updated"),
    })
    .from(docPages)
    .where(and(eq(docPages.status, "active"), eq(docPages.isDraft, 0)))
    .groupBy(docPages.projectId)
    .as("counts")

  const base = db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      description: projects.description,
      pageCount: sql<number>`coalesce(${counts.pageCount}, 0)`,
      lastUpdated: counts.lastUpdated,
    })
    .from(projects)
    .leftJoin(counts, eq(counts.projectId, projects.id))

  const rows =
    role === "admin"
      ? await base.where(eq(projects.isActive, 1)).orderBy(projects.name)
      : await base
          .innerJoin(
            projectMembers,
            and(
              eq(projectMembers.projectId, projects.id),
              eq(projectMembers.userId, userId),
            ),
          )
          .where(eq(projects.isActive, 1))
          .orderBy(projects.name)

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    pageCount: Number(r.pageCount ?? 0),
    updatedAt: r.lastUpdated ? new Date(Number(r.lastUpdated)) : null,
  }))
}
