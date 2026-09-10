import { and, eq, ne } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { assets, docPages } from "@/lib/db/schema"

// Everything the sidebar needs, without page bodies. Deleted rows are kept
// for restore hints and never shown; drafts are for admins only.
export async function listProjectPages(projectId: string, includeDrafts: boolean) {
  const db = await getDb()
  return db
    .select({
      id: docPages.id,
      path: docPages.path,
      slug: docPages.slug,
      title: docPages.title,
      sortOrder: docPages.sortOrder,
      isDraft: docPages.isDraft,
      updatedAt: docPages.updatedAt,
    })
    .from(docPages)
    .where(
      and(
        eq(docPages.projectId, projectId),
        ne(docPages.status, "deleted"),
        includeDrafts ? undefined : eq(docPages.isDraft, 0),
      ),
    )
}

export type ProjectPageSummary = Awaited<ReturnType<typeof listProjectPages>>[number]

// The one page being read, body included.
export async function getPage(id: string) {
  const db = await getDb()
  const [row] = await db.select().from(docPages).where(eq(docPages.id, id))
  return row ?? null
}

// Repo paths of every cached image and PDF in the project, for the renderer.
export async function listProjectAssetPaths(projectId: string): Promise<string[]> {
  const db = await getDb()
  const rows = await db
    .select({ repoPath: assets.repoPath })
    .from(assets)
    .where(eq(assets.projectId, projectId))
  return rows.map((r) => r.repoPath)
}
