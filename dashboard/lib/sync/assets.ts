import { randomUUID } from "node:crypto"
import { mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { eq, inArray } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { assets } from "@/lib/db/schema"
import { gh } from "@/lib/github/client"

// What the viewer serves. Images plus PDFs, which is what docs link to.
export const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  pdf: "application/pdf",
}

export const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i

// Blob reads come back as base64 inside JSON, so a big file costs about
// 1.4x its size in memory. Past this, skip it rather than stall the run.
export const MAX_ASSET_BYTES = 10 * 1024 * 1024

// Files are named by git blob sha, which is already a content hash: one copy
// per distinct file however many paths or projects point at it.
const HASH = /^[0-9a-f]{40,64}$/

export function assetDir(): string {
  return process.env.ASSET_DIR ?? join(process.cwd(), "data", "assets")
}

export function mimeFor(path: string): string | null {
  const dot = path.lastIndexOf(".")
  if (dot < 0 || dot < path.lastIndexOf("/")) return null
  return MIME[path.slice(dot + 1).toLowerCase()] ?? null
}

// Path to a stored file, or null for anything that is not a plain hash, so a
// bad row can never point the route outside the asset folder.
export function assetFile(hash: string): string | null {
  return HASH.test(hash) ? join(assetDir(), hash) : null
}

async function exists(path: string) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export interface WantedAsset {
  projectId: string
  path: string
  sha: string
  size: number
}

export interface AssetCounts {
  added: number
  changed: number
  removed: number
}

// Diff the assets under active projects against the tree, fetch what moved,
// drop what vanished, then delete stored files no row points at any more.
export async function syncAssets(opts: {
  owner: string
  repo: string
  projectIds: string[]
  wanted: Map<string, WantedAsset>
  fail: (path: string, e: unknown) => void
  warn: (message: string) => void
}): Promise<AssetCounts> {
  const { owner, repo, projectIds, wanted, fail, warn } = opts
  const counts: AssetCounts = { added: 0, changed: 0, removed: 0 }
  const db = await getDb()
  const dir = assetDir()
  await mkdir(dir, { recursive: true })

  const existing = projectIds.length
    ? await db.select().from(assets).where(inArray(assets.projectId, projectIds))
    : []
  const byKey = new Map(existing.map((r) => [`${r.projectId}:${r.repoPath}`, r]))

  for (const [key, want] of wanted) {
    const prior = byKey.get(key)
    if (prior && prior.hash === want.sha) continue

    if (want.size > MAX_ASSET_BYTES) {
      warn(`${want.path}: over 10 MB, not cached.`)
      continue
    }

    const file = assetFile(want.sha)
    if (!file) continue
    // Same bytes already stored for another path or project: no fetch.
    if (!(await exists(file))) {
      try {
        const blob = (await gh(`/repos/${owner}/${repo}/git/blobs/${want.sha}`)) as {
          content: string
          encoding: string
        }
        const bytes = Buffer.from(blob.content, blob.encoding === "base64" ? "base64" : "utf8")
        // Write then rename, so a crash never leaves half a file under a
        // hash name that later reads would trust.
        const tmp = `${file}.${randomUUID()}.tmp`
        await writeFile(tmp, bytes)
        await rename(tmp, file)
      } catch (e) {
        fail(want.path, e)
        continue
      }
    }

    const row = {
      projectId: want.projectId,
      repoPath: want.path,
      hash: want.sha,
      mimeType: mimeFor(want.path) ?? "application/octet-stream",
      size: want.size,
    }
    await db
      .insert(assets)
      .values({ id: prior?.id ?? randomUUID(), ...row, createdAt: new Date() })
      .onConflictDoUpdate({ target: [assets.projectId, assets.repoPath], set: row })
    if (prior) counts.changed++
    else counts.added++
  }

  for (const r of existing) {
    if (!wanted.has(`${r.projectId}:${r.repoPath}`)) {
      await db.delete(assets).where(eq(assets.id, r.id))
      counts.removed++
    }
  }

  // Rows for archived projects are kept, so their files are too. Runs never
  // overlap (the sync lock), so a .tmp left here is debris from a crash.
  const referenced = new Set((await db.select({ hash: assets.hash }).from(assets)).map((r) => r.hash))
  for (const name of await readdir(dir)) {
    if (referenced.has(name)) continue
    await rm(join(dir, name), { force: true })
  }

  return counts
}
