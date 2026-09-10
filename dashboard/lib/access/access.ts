import { and, eq } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { projectMembers, projects } from "@/lib/db/schema"

export interface AccessUser {
  id: string
  role: string
}

export type AccessibleProject = typeof projects.$inferSelect

// The one gate every project read goes through: pages, assets, search. It
// returns null for "no such project", "archived" and "not a member" alike,
// and callers turn every null into a 404, so status codes never reveal which
// projects exist. Admins skip the membership check and nothing else.
export async function requireProjectAccess(
  user: AccessUser,
  projectSlug: string,
): Promise<AccessibleProject | null> {
  const db = await getDb()
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, projectSlug))
  if (!project || !project.isActive) return null
  if (user.role === "admin") return project

  const [member] = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, project.id),
        eq(projectMembers.userId, user.id),
      ),
    )
  return member ? project : null
}
