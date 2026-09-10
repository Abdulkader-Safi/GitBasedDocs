// Runnable check for user management, on a throwaway database:
//   DATABASE_URL=file:./data/users-check.db bun lib/users/users.check.ts
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { rmSync } from "node:fs"

if (!process.env.DATABASE_URL?.includes("users-check")) {
  console.error("Refusing to run: set DATABASE_URL=file:./data/users-check.db")
  process.exit(1)
}
rmSync("./data/users-check.db", { force: true })

const { compare } = await import("bcryptjs")
const { eq } = await import("drizzle-orm")
const { getDb } = await import("@/lib/db")
const { projectMembers, projects, users } = await import("@/lib/db/schema")
const { passwordProblem } = await import("./password")
const u = await import("./users")

// --- password policy ---------------------------------------------------------
assert.equal(passwordProblem("short"), "Password must be at least 10 characters.")
assert.match(passwordProblem("password123") ?? "", /too common/)
assert.match(passwordProblem("Password123") ?? "", /too common/, "case does not dodge the list")
assert.match(passwordProblem("aaaaaaaaaaaa") ?? "", /too common/)
assert.match(passwordProblem("dana-secret-99", "dana@acme.io") ?? "", /email name/)
assert.equal(passwordProblem("correct horse battery"), null)
assert.equal(passwordProblem("x".repeat(9) + "y"), null)

// --- fixtures ------------------------------------------------------------------
const db = await getDb()
const now = new Date()
const proj = async (slug: string) => {
  const id = randomUUID()
  await db.insert(projects).values({ id, slug, name: slug, repoPath: slug, description: "", createdAt: now, updatedAt: now })
  return id
}
const acme = await proj("acme")
const north = await proj("north")
const adminId = await u.createUser({ name: "Root", email: "root@t.dev", password: "long enough pass", role: "admin", projectIds: [acme] }, "seed")

// --- create ----------------------------------------------------------------------
await assert.rejects(u.createUser({ name: "", email: "not-an-email", password: "long enough pass", role: "viewer", projectIds: [] }, adminId), /valid email/)
await assert.rejects(u.createUser({ name: "", email: "x@t.dev", password: "long enough pass", role: "owner", projectIds: [] }, adminId), /role/)
await assert.rejects(u.createUser({ name: "", email: "x@t.dev", password: "password123", role: "viewer", projectIds: [] }, adminId), /too common/)

const dana = await u.createUser({ name: " Dana ", email: " Dana@Acme.io ", password: "long enough pass", role: "viewer", projectIds: [acme, acme, "nope"] }, adminId)
await assert.rejects(u.createUser({ name: "", email: "dana@acme.io", password: "long enough pass", role: "viewer", projectIds: [] }, adminId), /already has an account/)
const [danaRow] = await db.select().from(users).where(eq(users.id, dana))
assert.equal(danaRow.email, "dana@acme.io", "email trimmed and lowercased")
assert.equal(danaRow.name, "Dana")
assert.equal(danaRow.mustChangePassword, 1, "admin-set password must be changed on first login")
assert.ok(await compare("long enough pass", danaRow.passwordHash!), "stored as a bcrypt hash")
const danaProjects = async () => (await db.select().from(projectMembers).where(eq(projectMembers.userId, dana))).map((m) => m.projectId)
assert.deepEqual(await danaProjects(), [acme], "duplicates and unknown project ids dropped")

// an admin never gets project rows: they already see everything
assert.deepEqual((await db.select().from(projectMembers).where(eq(projectMembers.userId, adminId))).length, 0)

// --- update ----------------------------------------------------------------------
await u.updateUser(dana, { projectIds: [north] }, adminId)
assert.deepEqual(await danaProjects(), [north], "project list replaced, not appended")
await u.updateUser(dana, { role: "admin" }, adminId)
assert.deepEqual(await danaProjects(), [], "promotion to admin clears project rows")

// lockout guards
await assert.rejects(u.updateUser(adminId, { role: "viewer" }, adminId), /your own admin access/)
await assert.rejects(u.updateUser(adminId, { isActive: false }, adminId), /your own admin access/)
await u.updateUser(dana, { role: "viewer" }, adminId) // two admins -> one, fine
await assert.rejects(u.updateUser(adminId, { isActive: false }, dana), /at least one active admin/)

// --- reset and revoke --------------------------------------------------------------
const before = Date.now()
await u.resetPassword(dana, "brand new passphrase")
const [afterReset] = await db.select().from(users).where(eq(users.id, dana))
assert.equal(afterReset.mustChangePassword, 1)
assert.ok(afterReset.sessionsRevokedAt && afterReset.sessionsRevokedAt.getTime() >= before, "reset ends existing sessions")
await assert.rejects(u.resetPassword(dana, "short"), /10 characters/)

// --- own password change -------------------------------------------------------------
await assert.rejects(u.changeOwnPassword(dana, "wrong", "another long one"), /Current password is wrong/)
await assert.rejects(u.changeOwnPassword(dana, "brand new passphrase", "brand new passphrase"), /not used here/)
await u.changeOwnPassword(dana, "brand new passphrase", "another long one")
const [changed] = await db.select().from(users).where(eq(users.id, dana))
assert.equal(changed.mustChangePassword, 0, "the forced change is satisfied")
assert.ok(await compare("another long one", changed.passwordHash!))

rmSync("./data/users-check.db", { force: true })
console.log("user checks ok")
