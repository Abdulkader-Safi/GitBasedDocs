// Runnable check for the danger actions, on a throwaway database:
//   DATABASE_URL=file:./data/danger-check.db bun lib/admin/danger.check.ts
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { rmSync } from "node:fs"

if (!process.env.DATABASE_URL?.includes("danger-check")) {
  console.error("Refusing to run: set DATABASE_URL=file:./data/danger-check.db")
  process.exit(1)
}
rmSync("./data/danger-check.db", { force: true })

const { eq } = await import("drizzle-orm")
const { getDb } = await import("@/lib/db")
const { auditLogs, docPages, projects } = await import("@/lib/db/schema")
const { renderCached } = await import("@/lib/render/markdown")
const d = await import("./danger")

const db = await getDb()
const now = new Date()
const actor = { id: "admin-1", email: "root@t.dev" }
const DAY = 24 * 60 * 60 * 1000

const acme = randomUUID()
await db.insert(projects).values({ id: acme, slug: "acme", name: "Acme", repoPath: "acme", description: "", createdAt: now, updatedAt: now })
const page = (path: string, status: string, ageDays: number) =>
  db.insert(docPages).values({
    id: randomUUID(), projectId: acme, path, slug: path, title: path, status,
    updatedAt: new Date(now.getTime() - ageDays * DAY),
  })
await page("old-gone.md", "deleted", 45)
await page("new-gone.md", "deleted", 5)
await page("old-live.md", "active", 90)

// --- archive -----------------------------------------------------------------
await assert.rejects(d.archiveProject(acme, "Acme", actor), /Type "acme"/, "phrase is the slug, exact")
await assert.rejects(d.archiveProject(acme, "", actor), /Type "acme"/)
await assert.rejects(d.archiveProject("nope", "acme", actor), /not found/)
await d.archiveProject(acme, " acme ", actor)
assert.equal((await db.select().from(projects).where(eq(projects.id, acme)))[0].isActive, 0)
await assert.rejects(d.archiveProject(acme, "acme", actor), /already archived/)

// --- purge -------------------------------------------------------------------
await assert.rejects(d.purgeDeletedPages("Purge", actor), /Type "purge"/)
const purged = await d.purgeDeletedPages("purge", actor, now)
assert.equal(purged.detail, "Purged 1 page.")
const left = (await db.select({ path: docPages.path }).from(docPages)).map((r) => r.path).sort()
assert.deepEqual(left, ["new-gone.md", "old-live.md"], "only deleted pages past the window go")

// --- cache -------------------------------------------------------------------
const ctx = { projectSlug: "acme", projectRepoPath: "acme", pagePath: "acme/a.md", pages: [] }
await renderCached("k1", "# one", ctx)
await renderCached("k2", "# two", ctx)
await assert.rejects(d.clearHtmlCache("clear", actor), /Type "clear cache"/)
assert.equal((await d.clearHtmlCache("clear cache", actor)).detail, "Cleared 2 cached pages.")
assert.equal((await d.clearHtmlCache("clear cache", actor)).detail, "Cleared 0 cached pages.")

// --- audit -------------------------------------------------------------------
// Refused attempts write nothing; each success writes one line.
const lines = await db.select().from(auditLogs)
assert.deepEqual(lines.map((l) => l.action).sort(), ["cache.clear", "cache.clear", "pages.purge", "project.archive"])
assert.ok(lines.every((l) => l.actorEmail === "root@t.dev" && l.actorId === "admin-1"))
assert.equal((await d.listAudit(2)).length, 2)

rmSync("./data/danger-check.db", { force: true })
console.log("danger checks ok")
