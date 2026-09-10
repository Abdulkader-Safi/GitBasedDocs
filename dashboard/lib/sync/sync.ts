import { randomUUID } from "crypto"
import { eq, inArray } from "drizzle-orm"
import matter from "gray-matter"

import { getDb } from "@/lib/db"
import { docPages, projects, repoConnections, syncLogs } from "@/lib/db/schema"
import { GitHubError, gh } from "@/lib/github/client"
import { getConnection } from "@/lib/github/connection"
import { mimeFor, syncAssets, type WantedAsset } from "@/lib/sync/assets"
import { stripComments } from "@/lib/render/comments"

export type SyncTrigger = "webhook" | "manual" | "cron"

export interface SyncResult {
  status: "unchanged" | "synced" | "error"
  headSha: string | null
  added: number
  changed: number
  removed: number
  errors: string[]
  durationMs: number
  // GitHub answered 403 or 429. The scheduler backs off on this.
  rateLimited: boolean
}

interface TreeEntry {
  path: string
  type: string
  sha: string
  size?: number
}

interface ProjectRow {
  id: string
  repoPath: string
}

const MD = /\.mdx?$/
const EXCERPT_MAX = 2000
// Anything past this is a render problem, not an index problem. Skip the
// fetch so one huge file cannot stall a whole run.
export const MAX_BLOB_BYTES = 2 * 1024 * 1024

// "docs/acme/guides/auth.md" under "docs/acme" becomes "guides/auth".
// The project's own index.md becomes "" so it can serve /p/{slug}.
export function pageSlug(repoPath: string, filePath: string): string {
  const rel = filePath.slice(repoPath.length).replace(/^\/+/, "")
  const noExt = rel.replace(MD, "")
  if (noExt === "index") return ""
  return noExt.replace(/\/index$/, "")
}

// Frontmatter title wins, then the first h1, then the file name.
export function titleFrom(
  data: Record<string, unknown>,
  body: string,
  filePath: string,
): string {
  const fm = data.title
  if (typeof fm === "string" && fm.trim()) return fm.trim()
  const h1 = body.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  const parts = filePath.split("/")
  const base = (parts[parts.length - 1] ?? filePath).replace(MD, "")
  // An untitled index.md stands in for its folder, so it takes the folder's
  // name. Otherwise every folder with an index shows up as "Index".
  const name =
    base.toLowerCase() === "index" && parts.length > 1 ? parts[parts.length - 2] : base
  const words = name.replace(/[-_]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// Plain text for the search index. Not a renderer, just enough to match on.
export function excerptFrom(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_]{1,3}/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, EXCERPT_MAX)
}

export function orderFrom(data: Record<string, unknown>): number {
  const raw = data.order
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 999
}

export function isDraftFrom(data: Record<string, unknown>): boolean {
  return data.draft === true
}

export function descriptionFrom(data: Record<string, unknown>): string {
  const d = data.description
  return typeof d === "string" ? d.trim() : ""
}

// Longest matching repoPath wins, so a project nested inside another
// project's folder still claims its own files. An empty repoPath means the
// whole repo, which is the shape when one repo holds one project's docs.
export function projectFor<T extends ProjectRow>(
  list: T[],
  filePath: string,
): T | null {
  let best: T | null = null
  for (const p of list) {
    const owns =
      p.repoPath === "" ||
      filePath === p.repoPath ||
      filePath.startsWith(`${p.repoPath}/`)
    if (owns && (!best || p.repoPath.length > best.repoPath.length)) best = p
  }
  return best
}

function key(projectId: string, path: string) {
  return `${projectId}:${path}`
}

function message(e: unknown): string {
  if (e instanceof GitHubError) return e.message
  if (e instanceof Error) return e.message
  return "Sync failed"
}

// ponytail: in-process lock. One app instance is the v1 deploy shape.
// Swap for a DB advisory lock the day this runs on more than one node.
let inFlight: Promise<SyncResult> | null = null

export function isSyncing(): boolean {
  return inFlight !== null
}

export function runSync(trigger: SyncTrigger = "manual"): Promise<SyncResult> {
  if (inFlight) return inFlight
  inFlight = doSync(trigger).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function doSync(trigger: SyncTrigger): Promise<SyncResult> {
  const startedAt = Date.now()
  const errors: string[] = []
  let added = 0
  let changed = 0
  let removed = 0
  let headSha: string | null = null
  let rateLimited = false
  const note = (e: unknown) => {
    if (e instanceof GitHubError && (e.status === 403 || e.status === 429)) rateLimited = true
    return message(e)
  }

  const db = await getDb()

  const finish = async (status: SyncResult["status"]): Promise<SyncResult> => {
    const durationMs = Date.now() - startedAt
    await db.insert(syncLogs).values({
      id: randomUUID(),
      trigger,
      status,
      headSha,
      added,
      changed,
      removed,
      errors: errors.join("\n"),
      durationMs,
      createdAt: new Date(),
    })
    return { status, headSha, added, changed, removed, errors, durationMs, rateLimited }
  }

  const connection = await getConnection()
  if (!connection) {
    errors.push("No GitHub connection is configured.")
    return finish("error")
  }

  const { owner, repo, branch, docsRoot } = connection
  const markConnection = async (
    status: string,
    lastError: string | null,
    syncedSha?: string | null,
  ) => {
    await db
      .update(repoConnections)
      .set({
        status,
        lastError,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
        ...(syncedSha !== undefined ? { lastSyncedSha: syncedSha } : {}),
      })
      .where(eq(repoConnections.id, connection.id))
  }

  await markConnection("syncing", connection.lastError)

  // 1. One cheap call: has the branch moved at all?
  try {
    const ref = (await gh(
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    )) as { object: { sha: string } }
    headSha = ref.object.sha
  } catch (e) {
    errors.push(note(e))
    await markConnection("error", message(e))
    return finish("error")
  }

  if (headSha === connection.lastSyncedSha) {
    await markConnection("connected", null)
    return finish("unchanged")
  }

  // 2. Full tree at that sha.
  let entries: TreeEntry[] = []
  try {
    const tree = (await gh(
      `/repos/${owner}/${repo}/git/trees/${headSha}?recursive=1`,
    )) as { tree: TreeEntry[]; truncated?: boolean }
    entries = tree.tree ?? []
    if (tree.truncated) {
      errors.push("Repo tree came back truncated. Some pages may be missing.")
    }
  } catch (e) {
    errors.push(note(e))
    await markConnection("error", message(e))
    return finish("error")
  }

  const activeProjects = await db
    .select({ id: projects.id, repoPath: projects.repoPath })
    .from(projects)
    .where(eq(projects.isActive, 1))

  if (!activeProjects.length) {
    await markConnection("connected", null, headSha)
    return finish("synced")
  }

  // 3. Every Markdown blob that belongs to a project folder. The connected
  // repo is the docs repo, so the whole tree is in scope unless docsRoot
  // narrows it.
  const root = (docsRoot ?? "").replace(/^\/+|\/+$/g, "")
  const wanted = new Map<string, { project: ProjectRow; entry: TreeEntry }>()
  // Images and PDFs under project folders, served by /api/assets.
  const wantedAssets = new Map<string, WantedAsset>()
  for (const entry of entries) {
    if (entry.type !== "blob") continue
    if (root && entry.path !== root && !entry.path.startsWith(`${root}/`)) continue
    const isPage = MD.test(entry.path)
    if (!isPage && !mimeFor(entry.path)) continue
    const project = projectFor(activeProjects, entry.path)
    if (!project) continue
    if (isPage) wanted.set(key(project.id, entry.path), { project, entry })
    else
      wantedAssets.set(key(project.id, entry.path), {
        projectId: project.id,
        path: entry.path,
        sha: entry.sha,
        size: entry.size ?? 0,
      })
  }

  const projectIds = activeProjects.map((p) => p.id)
  const existingRows = await db
    .select()
    .from(docPages)
    .where(inArray(docPages.projectId, projectIds))
  const existing = new Map(existingRows.map((r) => [key(r.projectId, r.path), r]))

  // 4. Fetch and upsert what actually moved.
  for (const [k, { project, entry }] of wanted) {
    const prior = existing.get(k)
    const unchangedBlob =
      prior && prior.blobSha === entry.sha && prior.status === "active"
    if (unchangedBlob) continue

    // Oversized files still get a row, with an empty body, so the viewer can
    // show "This file is too large to render." instead of a 404.
    if ((entry.size ?? 0) > MAX_BLOB_BYTES) {
      const row = {
        projectId: project.id,
        path: entry.path,
        slug: pageSlug(project.repoPath, entry.path),
        title: titleFrom({}, "", entry.path),
        sortOrder: 999,
        excerpt: "",
        content: "",
        description: "",
        size: entry.size ?? 0,
        blobSha: entry.sha,
        headSha,
        status: "active",
        isDraft: 0,
        updatedAt: new Date(),
      }
      await db
        .insert(docPages)
        .values({ id: prior?.id ?? randomUUID(), ...row })
        .onConflictDoUpdate({ target: [docPages.projectId, docPages.path], set: row })
      if (prior) changed++
      else added++
      continue
    }

    let raw: string
    try {
      const blob = (await gh(
        `/repos/${owner}/${repo}/git/blobs/${entry.sha}`,
      )) as { content: string; encoding: string }
      raw =
        blob.encoding === "base64"
          ? Buffer.from(blob.content, "base64").toString("utf8")
          : blob.content
    } catch (e) {
      // Keep the last good copy, flag it, try again next run.
      errors.push(`${entry.path}: ${note(e)}`)
      if (prior) await markStale(prior.id)
      continue
    }

    const parsed = matter(raw)
    const data = parsed.data as Record<string, unknown>
    // %% comments %% never reach the database, so they cannot be searched,
    // rendered or shown in a snippet.
    const body = stripComments(parsed.content)
    const row = {
      projectId: project.id,
      path: entry.path,
      slug: pageSlug(project.repoPath, entry.path),
      title: titleFrom(data, body, entry.path),
      sortOrder: orderFrom(data),
      excerpt: excerptFrom(body),
      content: body,
      description: descriptionFrom(data),
      size: entry.size ?? Buffer.byteLength(raw),
      blobSha: entry.sha,
      headSha,
      status: "active",
      isDraft: isDraftFrom(data) ? 1 : 0,
      updatedAt: new Date(),
    }

    await db
      .insert(docPages)
      .values({ id: prior?.id ?? randomUUID(), ...row })
      .onConflictDoUpdate({
        target: [docPages.projectId, docPages.path],
        set: row,
      })

    if (prior) changed++
    else added++
  }

  // 5. Paths that vanished from the tree. Kept 30 days for restore hints.
  const gone = existingRows.filter(
    (r) => r.status !== "deleted" && !wanted.has(key(r.projectId, r.path)),
  )
  for (const row of gone) {
    await db
      .update(docPages)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(eq(docPages.id, row.id))
    removed++
  }

  // 6. Images and PDFs. Counted with pages in the run totals: the log is
  // about files that moved, not only Markdown.
  const assetCounts = await syncAssets({
    owner,
    repo,
    projectIds,
    wanted: wantedAssets,
    fail: (path, e) => errors.push(`${path}: ${note(e)}`),
    warn: (m) => errors.push(m),
  })
  added += assetCounts.added
  changed += assetCounts.changed
  removed += assetCounts.removed

  await markConnection("connected", errors.length ? errors[0] : null, headSha)
  return finish("synced")

  async function markStale(id: string) {
    await db
      .update(docPages)
      .set({ status: "stale", updatedAt: new Date() })
      .where(eq(docPages.id, id))
  }
}
