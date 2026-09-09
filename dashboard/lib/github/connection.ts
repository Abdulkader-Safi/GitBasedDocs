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
  const docsRoot = input.docsRoot.trim().replace(/^\/+|\/+$/g, "") || "docs"
  if (!owner || !repo) throw new Error("Owner and repo are required")
  const db = await getDb()
  const now = new Date()
  const existing = await getConnection()
  if (existing) {
    await db
      .update(repoConnections)
      .set({ owner, repo, branch, docsRoot, updatedAt: now })
      .where(eq(repoConnections.id, existing.id))
    return { ...existing, owner, repo, branch, docsRoot }
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
    check("docs", async () => {
      const items = (await gh(
        `/repos/${owner}/${repo}/contents/${docsRoot}?ref=${branch}`,
      )) as Array<{ name: string }>
      const md = items.filter((i) => i.name.endsWith(".md") || i.name.endsWith(".mdx"))
      if (!md.length) throw new GitHubError(404, "No Markdown files in docs root")
      return `${md.length} Markdown file(s) in ${docsRoot}`
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
