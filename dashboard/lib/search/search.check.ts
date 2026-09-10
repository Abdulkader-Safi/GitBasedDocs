// Runnable check for project search, on a throwaway database:
//   DATABASE_URL=file:./data/search-check.db bun lib/search/search.check.ts
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { rmSync } from "node:fs"

if (!process.env.DATABASE_URL?.includes("search-check")) {
  console.error("Refusing to run: set DATABASE_URL=file:./data/search-check.db")
  process.exit(1)
}
rmSync("./data/search-check.db", { force: true })

const { getDb } = await import("@/lib/db")
const { accessLogs, docPages, projects, users } = await import("@/lib/db/schema")
const s = await import("./search")

// --- pure helpers -----------------------------------------------------------
assert.deepEqual(s.tokenize("  Rate  LIMITS rate "), ["rate", "limits"])
assert.equal(s.tokenize(Array.from({ length: 30 }, (_, i) => `w${i}`).join(" ")).length, 8)
assert.equal(s.escapeLike("100%_a\\b"), "100\\%\\_a\\\\b")
assert.equal(s.trailOf("guides/advanced/auth"), "guides / advanced")
assert.equal(s.trailOf("install"), "")
assert.equal(
  s.plainText("# Title\n\nSee [[Other note|the other]] and [a link](x.md).\n\n```js\nsecret()\n```\n> [!NOTE]\n> careful"),
  "Title See the other and a link. careful",
)
const long = "word ".repeat(40) + "needle here " + "word ".repeat(40)
const snip = s.makeSnippet(long, ["needle"])
assert.ok(snip.includes("needle here"), snip)
assert.ok(snip.startsWith("…") && snip.endsWith("…"), "cut on both sides")
assert.ok(snip.length <= 170)

// --- fixtures ---------------------------------------------------------------
const db = await getDb()
const now = Date.now()
const project = async (slug: string) => {
  const id = randomUUID()
  await db.insert(projects).values({ id, slug, name: slug, repoPath: slug, description: "", createdAt: new Date(), updatedAt: new Date() })
  return id
}
const page = async (projectId: string, slug: string, title: string, content: string, extra: Partial<{ isDraft: number; status: string; ageMin: number }> = {}) => {
  await db.insert(docPages).values({
    id: randomUUID(), projectId, path: `${slug}.md`, slug, title, content, excerpt: "",
    isDraft: extra.isDraft ?? 0, status: extra.status ?? "active",
    updatedAt: new Date(now - (extra.ageMin ?? 0) * 60_000),
  })
}

const acme = await project("acme")
const other = await project("other")
await page(acme, "guides/auth", "Authentication", "Every request carries a bearer token.", { ageMin: 30 })
await page(acme, "tokens", "Rotating tokens", "How to rotate a leaked token.", { ageMin: 20 })
await page(acme, "install", "Install", "Run the installer. Token scopes are listed later.", { ageMin: 10 })
await page(acme, "pricing", "Pricing", "Plans cost 100% of list price_tier.", { ageMin: 5 })
await page(acme, "secret-draft", "Token draft", "unreleased token plans", { isDraft: 1 })
await page(acme, "old", "Old token page", "token", { status: "deleted" })
// the other project has the best possible match, and must never show up
await page(other, "token", "Token", "token token token")

const slugs = async (q: string, includeDrafts = false) =>
  (await s.searchPages(acme, q, { includeDrafts })).map((h) => h.slug)

// scoped to one project, even when another has a better match
assert.ok(!(await slugs("token")).includes("token"), "never returns another project's page")

// title matches rank above body matches; deleted and drafts are left out
assert.deepEqual(await slugs("token"), ["tokens", "guides/auth", "install"])
assert.deepEqual((await slugs("token", true)).slice(0, 2), ["secret-draft", "tokens"], "drafts for admins, title-first")

// every term must appear
assert.deepEqual(await slugs("token rotate"), ["tokens"])
assert.deepEqual(await slugs("token nonsense"), [])

// % and _ are literal characters, not wildcards
assert.deepEqual(await slugs("100%"), ["pricing"])
assert.deepEqual(await slugs("price_tier"), ["pricing"])
assert.deepEqual(await slugs("%"), ["pricing"], "a lone % matches only text that contains one")
assert.deepEqual(await slugs("   "), [])

// hits carry a trail and a snippet around the term
const [auth] = await s.searchPages(acme, "bearer", { includeDrafts: false })
assert.equal(auth.trail, "guides")
assert.match(auth.snippet, /bearer token/)

// --- recent pages ------------------------------------------------------------
const me = randomUUID()
const someoneElse = randomUUID()
for (const id of [me, someoneElse]) {
  await db.insert(users).values({ id, email: `${id}@t.dev`, createdAt: new Date(), updatedAt: new Date() })
}
const open = async (userId: string, path: string, minAgo: number, allowed = 1) =>
  db.insert(accessLogs).values({ id: randomUUID(), userId, projectId: acme, path, allowed, createdAt: new Date(now - minAgo * 60_000) })

await open(me, "/p/acme/install", 30)
await open(me, "/p/acme/guides/auth", 10)
await open(me, "/p/acme/install", 5)          // opened again: one entry, most recent first
await open(me, "/p/acme/secret-draft", 3)     // a draft: hidden from a viewer's list
await open(me, "/p/acme/tokens", 1, 0)        // a denied attempt never counts as opened
await open(someoneElse, "/p/acme/pricing", 0) // another person's history never leaks in

const recent = (await s.recentPages(acme, "acme", me, { includeDrafts: false, limit: 4 })).map((h) => h.slug)
assert.deepEqual(recent.slice(0, 2), ["install", "guides/auth"], "my opens first, newest first, no repeats")
assert.ok(!recent.includes("secret-draft"))
assert.equal(recent.length, 4, "topped up with recently updated pages")
assert.deepEqual(recent.slice(2), ["pricing", "tokens"], "fill-ins by recent update")

const fresh = (await s.recentPages(acme, "acme", randomUUID(), { includeDrafts: false, limit: 3 })).map((h) => h.slug)
assert.deepEqual(fresh, ["pricing", "install", "tokens"], "no history: most recently updated")

rmSync("./data/search-check.db", { force: true })
console.log("search checks ok")
