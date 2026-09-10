import { randomUUID } from "node:crypto"
import { and, asc, eq, ne } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { projectMembers, projects, users } from "@/lib/db/schema"

export interface Member {
  userId: string
  name: string | null
  email: string
  role: string
  isActive: boolean
  addedAt: Date
}

export async function listMembers(projectId: string): Promise<Member[]> {
  const db = await getDb()
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      addedAt: projectMembers.createdAt,
    })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId))
    .orderBy(asc(users.email))
  return rows.map((r) => ({ ...r, isActive: Boolean(r.isActive) }))
}

// People who can be given access. Admins already see every project, so
// adding them would do nothing; deactivated accounts cannot sign in.
export async function listGrantableUsers() {
  const db = await getDb()
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(and(ne(users.role, "admin"), eq(users.isActive, 1)))
    .orderBy(asc(users.email))
}

// Grant takes effect on the user's next request: every read runs
// requireProjectAccess, so there is no session to refresh.
export async function addMember(projectId: string, userId: string, addedBy: string) {
  const db = await getDb()
  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId))
  if (!project) throw new Error("Project not found")
  const [user] = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) throw new Error("User not found")
  if (user.role === "admin") throw new Error("Admins already see every project")
  if (!user.isActive) throw new Error("That account is deactivated")

  await db
    .insert(projectMembers)
    .values({ id: randomUUID(), projectId, userId, addedBy, createdAt: new Date() })
    // Adding someone twice is a no-op, not an error.
    .onConflictDoNothing({ target: [projectMembers.projectId, projectMembers.userId] })
}

// Removal is instant for the same reason: the next request re-checks.
export async function removeMember(projectId: string, userId: string) {
  const db = await getDb()
  await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
}
