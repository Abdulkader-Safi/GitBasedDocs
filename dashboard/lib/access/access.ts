import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { accessLogs, projectMembers, projects } from "@/lib/db/schema"

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
  const { project, allowed } = await checkProjectAccess(user, projectSlug)
  return allowed ? project : null
}

// Same decision, but it also hands back the project row when one exists, so
// the access log can say which project a denied request was aiming at. Only
// the admin-only log ever sees that; readers still get a plain 404.
export async function checkProjectAccess(
  user: AccessUser,
  projectSlug: string,
): Promise<{ project: AccessibleProject | null; allowed: boolean }> {
  const db = await getDb()
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, projectSlug))
  if (!project) return { project: null, allowed: false }
  if (!project.isActive) return { project, allowed: false }
  if (user.role === "admin") return { project, allowed: true }

  const [member] = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, project.id),
        eq(projectMembers.userId, user.id),
      ),
    )
  return { project, allowed: Boolean(member) }
}

// One row per page open and per denied attempt. Call it from after() so the
// write never slows the response down.
export async function logAccess(entry: {
  userId: string
  projectId: string | null
  path: string
  allowed: boolean
}) {
  try {
    const db = await getDb()
    await db.insert(accessLogs).values({
      id: randomUUID(),
      userId: entry.userId,
      projectId: entry.projectId,
      path: entry.path.slice(0, 500),
      allowed: entry.allowed ? 1 : 0,
      createdAt: new Date(),
    })
  } catch (e) {
    // Losing a log line must never break a page.
    console.error("[access] could not write log", e)
  }
}
