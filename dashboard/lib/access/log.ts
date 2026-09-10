import { and, asc, desc, eq, gte, sql } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { accessLogs, projects, users } from "@/lib/db/schema"

export interface AccessFilter {
  userId?: string
  projectId?: string
  result?: "allowed" | "denied"
}

// The spec asks for the last 500 events, filterable. Filters narrow first,
// so "denied for this user" still reaches back past 500 page opens.
export async function listAccessEvents(filter: AccessFilter, limit = 500) {
  const db = await getDb()
  const where = and(
    filter.userId ? eq(accessLogs.userId, filter.userId) : undefined,
    filter.projectId ? eq(accessLogs.projectId, filter.projectId) : undefined,
    filter.result ? eq(accessLogs.allowed, filter.result === "allowed" ? 1 : 0) : undefined,
  )
  return db
    .select({
      id: accessLogs.id,
      path: accessLogs.path,
      allowed: accessLogs.allowed,
      createdAt: accessLogs.createdAt,
      email: users.email,
      projectName: projects.name,
    })
    .from(accessLogs)
    .leftJoin(users, eq(users.id, accessLogs.userId))
    .leftJoin(projects, eq(projects.id, accessLogs.projectId))
    .where(where)
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit)
}

export async function accessFilterOptions() {
  const db = await getDb()
  const [userRows, projectRows] = await Promise.all([
    db.select({ id: users.id, email: users.email }).from(users).orderBy(asc(users.email)),
    db.select({ id: projects.id, name: projects.name }).from(projects).orderBy(asc(projects.name)),
  ])
  return { users: userRows, projects: projectRows }
}

export async function deniedInLastDays(days: number): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000)
  const db = await getDb()
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(accessLogs)
    .where(and(eq(accessLogs.allowed, 0), gte(accessLogs.createdAt, since)))
  return Number(row?.n ?? 0)
}
