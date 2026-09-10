import { randomUUID } from "node:crypto"
import { compare, hash } from "bcryptjs"
import { and, asc, eq, ne, sql } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { projectMembers, projects, users } from "@/lib/db/schema"
import { passwordProblem } from "./password"

export const ROLES = ["admin", "editor", "viewer"] as const
export type Role = (typeof ROLES)[number]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Email is the sign-in name: trimmed, lowercased, unique.
function cleanEmail(raw: string) {
  const email = raw.trim().toLowerCase()
  if (!EMAIL.test(email)) throw new Error("Enter a valid email address.")
  return email
}

async function assertEmailFree(email: string, exceptId?: string) {
  const db = await getDb()
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (taken && taken.id !== exceptId) throw new Error("That email already has an account.")
}

function cleanName(raw: string) {
  const name = raw.trim()
  if (name.length > 100) throw new Error("Keep the name under 100 characters.")
  return name || null
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
}

export async function listUsers() {
  const db = await getDb()
  const [rows, memberships] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.email)),
    db.select({ userId: projectMembers.userId, projectId: projectMembers.projectId }).from(projectMembers),
  ])
  const byUser = new Map<string, string[]>()
  for (const m of memberships) byUser.set(m.userId, [...(byUser.get(m.userId) ?? []), m.projectId])
  return rows.map((u) => ({ ...u, isActive: Boolean(u.isActive), projectIds: byUser.get(u.id) ?? [] }))
}

export async function listProjectChoices() {
  const db = await getDb()
  return db
    .select({ id: projects.id, name: projects.name, isActive: projects.isActive })
    .from(projects)
    .orderBy(asc(projects.name))
}

async function activeAdminCount(exceptId?: string) {
  const db = await getDb()
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(users)
    .where(
      and(eq(users.role, "admin"), eq(users.isActive, 1), exceptId ? ne(users.id, exceptId) : undefined),
    )
  return Number(row?.n ?? 0)
}

// Make the user's project list exactly `projectIds`. Admins get none: they
// see every project already.
async function setProjects(userId: string, role: string, projectIds: string[], addedBy: string) {
  const db = await getDb()
  await db.delete(projectMembers).where(eq(projectMembers.userId, userId))
  if (role === "admin") return
  const unique = [...new Set(projectIds)]
  if (!unique.length) return
  const known = new Set((await db.select({ id: projects.id }).from(projects)).map((p) => p.id))
  const now = new Date()
  const rows = unique
    .filter((id) => known.has(id))
    .map((projectId) => ({ id: randomUUID(), projectId, userId, addedBy, createdAt: now }))
  if (rows.length) await db.insert(projectMembers).values(rows)
}

export async function createUser(
  input: { name: string; email: string; password: string; role: string; projectIds: string[] },
  actorId: string,
) {
  const email = cleanEmail(input.email)
  const name = cleanName(input.name)
  if (!isRole(input.role)) throw new Error("Pick a role.")
  const problem = passwordProblem(input.password, email)
  if (problem) throw new Error(problem)

  const db = await getDb()
  await assertEmailFree(email)

  const id = randomUUID()
  const now = new Date()
  await db.insert(users).values({
    id,
    name,
    email,
    passwordHash: await hash(input.password, 12),
    role: input.role,
    isActive: 1,
    // Admin picked this password; the person sets their own on first login.
    mustChangePassword: 1,
    createdAt: now,
    updatedAt: now,
  })
  if (input.projectIds.length) await setProjects(id, input.role, input.projectIds, actorId)
  return id
}

export async function updateUser(
  id: string,
  input: { name?: string; email?: string; role?: string; isActive?: boolean; projectIds?: string[] },
  actorId: string,
) {
  const db = await getDb()
  const [user] = await db.select().from(users).where(eq(users.id, id))
  if (!user) throw new Error("User not found.")

  const role = input.role ?? user.role
  if (input.role !== undefined && !isRole(input.role)) throw new Error("Pick a role.")
  const email = input.email !== undefined ? cleanEmail(input.email) : undefined
  if (email !== undefined && email !== user.email) await assertEmailFree(email, id)

  // Nobody can lock the admin area out: not by demoting or deactivating
  // themselves, and not by removing the last active admin.
  const losesAdmin = user.role === "admin" && (role !== "admin" || input.isActive === false)
  if (losesAdmin && id === actorId) throw new Error("You cannot remove your own admin access.")
  if (losesAdmin && (await activeAdminCount(id)) === 0) throw new Error("Keep at least one active admin.")

  await db
    .update(users)
    .set({
      ...(input.name !== undefined ? { name: cleanName(input.name) } : {}),
      ...(email !== undefined ? { email } : {}),
      role,
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))

  // Becoming an admin makes project rows pointless; clear them.
  if (input.projectIds !== undefined || (role === "admin" && user.role !== "admin")) {
    await setProjects(id, role, input.projectIds ?? [], actorId)
  }
}

// Admin reset: new temporary password, forced change on next login, and
// every existing session for that person ends on its next request.
export async function resetPassword(id: string, password: string) {
  const db = await getDb()
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, id))
  if (!user) throw new Error("User not found.")
  const problem = passwordProblem(password, user.email)
  if (problem) throw new Error(problem)
  await db
    .update(users)
    .set({
      passwordHash: await hash(password, 12),
      mustChangePassword: 1,
      sessionsRevokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
}

export async function revokeSessions(id: string) {
  const db = await getDb()
  await db.update(users).set({ sessionsRevokedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id))
}

// The person editing their own name and email. A new email needs the
// current password, since the email is what they sign in with: a borrowed,
// unlocked laptop should not be enough to take the account over.
export async function updateOwnProfile(
  id: string,
  input: { name: string; email: string; currentPassword?: string },
) {
  const db = await getDb()
  const [user] = await db.select().from(users).where(eq(users.id, id))
  if (!user?.passwordHash) throw new Error("User not found.")
  const name = cleanName(input.name)
  const email = cleanEmail(input.email)
  if (email !== user.email) {
    if (!input.currentPassword || !(await compare(input.currentPassword, user.passwordHash))) {
      throw new Error("Enter your current password to change your email.")
    }
    await assertEmailFree(email, id)
  }
  await db.update(users).set({ name, email, updatedAt: new Date() }).where(eq(users.id, id))
}

// The person changing their own password. Other sessions stay: revoking
// them here would also end this one, and refreshing this token instead
// would give a revoked token a way back in.
export async function changeOwnPassword(id: string, current: string, next: string) {
  const db = await getDb()
  const [user] = await db.select().from(users).where(eq(users.id, id))
  if (!user?.passwordHash) throw new Error("User not found.")
  if (!(await compare(current, user.passwordHash))) throw new Error("Current password is wrong.")
  if (current === next) throw new Error("Pick a password you have not used here.")
  const problem = passwordProblem(next, user.email)
  if (problem) throw new Error(problem)
  await db
    .update(users)
    .set({ passwordHash: await hash(next, 12), mustChangePassword: 0, updatedAt: new Date() })
    .where(eq(users.id, id))
}
