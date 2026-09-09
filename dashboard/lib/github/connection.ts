import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

import { getDb } from "@/lib/db"
import { repoConnections } from "@/lib/db/schema"
import { GitHubError, gh } from "./client"

export interface ConnectionInput {
  owner: string
  repo: string
  branch: string
  docsRoot: string
}

export interface CheckResult {
  name: string
  ok: boolean
  message: string
}

export async function getConnection() {
  const db = await getDb()
  const [row] = await db.select().from(repoConnections)
  return row ?? null
}

export async function saveConnection(input: ConnectionInput) {
  const owner = input.owner.trim()
  const repo = input.repo.trim().replace(/\.git$/, "")
  const branch = input.branch.trim() || "main"
  // The connected repo is the docs repo, so the whole repo is in scope by
  // default. Empty docsRoot means repo root; set it only to narrow.
  const docsRoot = input.docsRoot.trim().replace(/^\/+|\/+$/g, "")
  if (!owner || !repo) throw new Error("Owner and repo are required")
  const db = await getDb()
  const now = new Date()
  const existing = await getConnection()
  if (existing) {
    // Pointing at a different repo or branch invalidates everything we knew.
    // Keeping the old head sha would let the next sync compare against a
    // foreign commit, and keeping the old status would claim a repo we have
    // never actually read is connected.
    const retargeted =
      existing.owner !== owner ||
      existing.repo !== repo ||
      existing.branch !== branch

    const patch = {
      owner,
      repo,
      branch,
      docsRoot,
      updatedAt: now,
      ...(retargeted
        ? { lastSyncedSha: null, lastCheckedAt: null, lastError: null }
        : {}),
    }
    await db
      .update(repoConnections)
      .set(patch)
      .where(eq(repoConnections.id, existing.id))
    const [row] = await db
      .select()
      .from(repoConnections)
      .where(eq(repoConnections.id, existing.id))
    return row
  }
  const id = randomUUID()
  await db.insert(repoConnections).values({
    id, owner, repo, branch, docsRoot,
    createdAt: now, updatedAt: now,
  })
  const [row] = await db.select().from(repoConnections).where(eq(repoConnections.id, id))
  return row
}

async function check(
  name: string,
  run: () => Promise<string>,
): Promise<CheckResult> {
  try {
    return { name, ok: true, message: await run() }
  } catch (e) {
    const message = e instanceof GitHubError ? e.message : "Check failed"
    return { name, ok: false, message }
  }
}

// Three checks from the spec: auth works, repo plus branch found,
// docs root lists at least one Markdown file.
export async function testConnection(input: ConnectionInput) {
  const { owner, repo, branch, docsRoot } = input
  const results = await Promise.all([
    check("auth", async () => {
      const me = (await gh("/user")) as { login: string }
      return `Token works as ${me.login}`
    }),
    check("repo", async () => {
      const ref = (await gh(
        `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      )) as { object: { sha: string } }
      return `Branch ${branch} at ${ref.object.sha.slice(0, 7)}`
    }),
    // Count Markdown anywhere in scope, not just at the top level, because
    // most docs repos keep every page in nested folders.
    check("docs", async () => {
      const root = (docsRoot ?? "").replace(/^\/+|\/+$/g, "")
      const ref = (await gh(
        `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      )) as { object: { sha: string } }
      const tree = (await gh(
        `/repos/${owner}/${repo}/git/trees/${ref.object.sha}?recursive=1`,
      )) as { tree: Array<{ path: string; type: string }> }
      const md = (tree.tree ?? []).filter(
        (t) =>
          t.type === "blob" &&
          /\.mdx?$/.test(t.path) &&
          (!root || t.path === root || t.path.startsWith(`${root}/`)),
      )
      const where = root ? root : "the repo"
      if (!md.length) throw new GitHubError(404, `No Markdown files in ${where}`)
      return `${md.length} Markdown file(s) in ${where}`
    }),
  ])
  const db = await getDb()
  const existing = await getConnection()
  const failed = results.find((r) => !r.ok)
  if (existing) {
    await db
      .update(repoConnections)
      .set({
        status: failed ? "error" : "connected",
        lastError: failed ? failed.message : null,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(repoConnections.id, existing.id))
  }
  return results
}
