// Runnable check for the project access gate, on a throwaway database:
//   DATABASE_URL=file:./data/access-check.db bun lib/access/access.check.ts
// This is the core promise of the product (a client sees only their own
// projects), so it gets exercised against a real schema, not mocks.
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { rmSync } from "node:fs"

if (!process.env.DATABASE_URL?.includes("access-check")) {
  console.error("Refusing to run: set DATABASE_URL=file:./data/access-check.db")
  process.exit(1)
}
rmSync("./data/access-check.db", { force: true })

const { getDb } = await import("@/lib/db")
const { projectMembers, projects, users } = await import("@/lib/db/schema")
const { requireProjectAccess } = await import("./access")
const { eq } = await import("drizzle-orm")

const db = await getDb()
const now = new Date()

async function user(role: string) {
  const id = randomUUID()
  await db.insert(users).values({ id, email: `${id}@test.dev`, role, createdAt: now, updatedAt: now })
  return { id, role }
}
async function project(slug: string, isActive = 1) {
  const id = randomUUID()
  await db.insert(projects).values({
    id, slug, name: slug, repoPath: slug, description: "", isActive, createdAt: now, updatedAt: now,
  })
  return id
}
async function link(userId: string, projectId: string) {
  await db.insert(projectMembers).values({ id: randomUUID(), userId, projectId, createdAt: now })
}

const acme = await project("acme")
const northwind = await project("northwind")
const archived = await project("archived", 0)

const viewerA = await user("viewer")
const viewerB = await user("viewer")
const admin = await user("admin")
await link(viewerA.id, acme)
await link(viewerA.id, archived)
await link(viewerB.id, northwind)

const can = async (u: { id: string; role: string }, slug: string) =>
  (await requireProjectAccess(u, slug))?.slug ?? null

// members open their own projects, and only those
assert.equal(await can(viewerA, "acme"), "acme")
assert.equal(await can(viewerA, "northwind"), null, "viewer A must not open B's project")
assert.equal(await can(viewerB, "northwind"), "northwind")
assert.equal(await can(viewerB, "acme"), null, "viewer B must not open A's project")

// an archived project is closed even to its members
assert.equal(await can(viewerA, "archived"), null, "archived project stays closed to members")

// admins skip membership, not the archive rule
assert.equal(await can(admin, "acme"), "acme")
assert.equal(await can(admin, "northwind"), "northwind")
assert.equal(await can(admin, "archived"), null)

// a missing project looks exactly like a forbidden one
assert.equal(await can(viewerA, "does-not-exist"), null)

// removing a membership takes effect on the very next check
await db.delete(projectMembers).where(eq(projectMembers.userId, viewerA.id))
assert.equal(await can(viewerA, "acme"), null, "removed member loses access immediately")

rmSync("./data/access-check.db", { force: true })
console.log("access checks ok")
