import { randomUUID } from "node:crypto"
import { and, desc, eq, lt } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { auditLogs, docPages, projects } from "@/lib/db/schema"
import { clearRenderCache } from "@/lib/render/markdown"

export interface Actor {
  id: string
  email: string
}

export const PURGE_AFTER_DAYS = 30
// What the admin types. Archive asks for the project's slug instead.
export const PHRASES = { purge: "purge", cache: "clear cache" } as const

function checkPhrase(typed: string, expected: string) {
  if (typed.trim() !== expected) throw new Error(`Type "${expected}" to confirm.`)
}

export async function writeAudit(actor: Actor, action: string, detail = "") {
  const db = await getDb()
  await db.insert(auditLogs).values({
    id: randomUUID(),
    actorId: actor.id,
    actorEmail: actor.email,
    action,
    detail,
    createdAt: new Date(),
  })
}

export async function listAudit(limit = 20) {
  const db = await getDb()
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit)
}

export async function archiveProject(projectId: string, typed: string, actor: Actor) {
  const db = await getDb()
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId))
  if (!project) throw new Error("Project not found.")
  if (!project.isActive) throw new Error("That project is already archived.")
  checkPhrase(typed, project.slug)
  await db.update(projects).set({ isActive: 0, updatedAt: new Date() }).where(eq(projects.id, projectId))
  await writeAudit(actor, "project.archive", `${project.name} (${project.slug})`)
  return { detail: `Archived ${project.name}.` }
}

// Sync marks a page "deleted" when its file leaves the repo. Those rows stay
// a while so a bad push can be reverted; past the window they go for good.
export async function purgeDeletedPages(typed: string, actor: Actor, now = new Date()) {
  checkPhrase(typed, PHRASES.purge)
  const db = await getDb()
  const cutoff = new Date(now.getTime() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000)
  const gone = await db
    .delete(docPages)
    .where(and(eq(docPages.status, "deleted"), lt(docPages.updatedAt, cutoff)))
    .returning({ id: docPages.id })
  await writeAudit(actor, "pages.purge", `${gone.length} deleted pages older than ${PURGE_AFTER_DAYS} days`)
  return { detail: `Purged ${gone.length} ${gone.length === 1 ? "page" : "pages"}.` }
}

export async function clearHtmlCache(typed: string, actor: Actor) {
  checkPhrase(typed, PHRASES.cache)
  const n = clearRenderCache()
  await writeAudit(actor, "cache.clear", `${n} rendered pages dropped`)
  return { detail: `Cleared ${n} cached ${n === 1 ? "page" : "pages"}.` }
}
