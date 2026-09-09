import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

import { getDb } from "@/lib/db"
import { projects } from "@/lib/db/schema"
import { GitHubError, gh } from "@/lib/github/client"
import { getConnection } from "@/lib/github/connection"

const SLUG_RE = /^[a-z0-9-]{2,48}$/

export interface ProjectInput {
  name: string
  slug: string
  repoPath: string
  description?: string
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

function cleanPath(p: string): string {
  return p.trim().replace(/^\/+|\/+$/g, "")
}

// Path must sit under the connection docs root, with no escapes.
function checkPathEscapes(repoPath: string) {
  if (!repoPath || repoPath.includes("..") || repoPath.startsWith("/")) {
    throw new Error("Path must be a folder under the docs root, no ../ allowed")
  }
}

function checkPathShape(repoPath: string, docsRoot: string) {
  if (repoPath !== docsRoot && !repoPath.startsWith(`${docsRoot}/`)) {
    throw new Error(`Path must sit under ${docsRoot}`)
  }
}

// Live folder check through the API until the sync tree exists.
async function checkPathExists(
  owner: string,
  repo: string,
  branch: string,
  repoPath: string,
) {
  try {
    await gh(`/repos/${owner}/${repo}/contents/${repoPath}?ref=${branch}`)
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) {
      throw new Error("Folder not found in repo")
    }
    throw e
  }
}

export async function listProjects() {
  const db = await getDb()
  return db.select().from(projects)
}

export async function createProject(input: ProjectInput) {
  const name = input.name.trim()
  const slug = input.slug.trim()
  const description = input.description?.trim() ?? ""
  if (!name) throw new Error("Name is required")
  if (!SLUG_RE.test(slug)) {
    throw new Error("Slug must be 2-48 chars of lowercase letters, numbers, dashes")
  }
  const repoPath = cleanPath(input.repoPath)
  checkPathEscapes(repoPath)
  const connection = await getConnection()
  if (!connection) throw new Error("Connect a repo first")
  checkPathShape(repoPath, connection.docsRoot)
  await checkPathExists(connection.owner, connection.repo, connection.branch, repoPath)

  const db = await getDb()
  const now = new Date()
  const id = randomUUID()
  try {
    await db.insert(projects).values({
      id, name, slug, repoPath, description,
      createdAt: now, updatedAt: now,
    })
  } catch {
    throw new Error("Slug or path is already used by another project")
  }
  const [row] = await db.select().from(projects).where(eq(projects.id, id))
  return row
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput & { isActive: number }>,
) {
  const db = await getDb()
  const [existing] = await db.select().from(projects).where(eq(projects.id, id))
  if (!existing) throw new Error("Project not found")
  const patch: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() }
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error("Name is required")
    patch.name = input.name.trim()
  }
  if (input.slug !== undefined) {
    if (!SLUG_RE.test(input.slug.trim())) {
      throw new Error("Slug must be 2-48 chars of lowercase letters, numbers, dashes")
    }
    patch.slug = input.slug.trim()
  }
  if (input.description !== undefined) patch.description = input.description.trim()
  if (input.isActive !== undefined) patch.isActive = input.isActive ? 1 : 0
  if (input.repoPath !== undefined) {
    const repoPath = cleanPath(input.repoPath)
    checkPathEscapes(repoPath)
    const connection = await getConnection()
    if (!connection) throw new Error("Connect a repo first")
    checkPathShape(repoPath, connection.docsRoot)
    await checkPathExists(connection.owner, connection.repo, connection.branch, repoPath)
    patch.repoPath = repoPath
  }
  try {
    await db.update(projects).set(patch).where(eq(projects.id, id))
  } catch {
    throw new Error("Slug or path is already used by another project")
  }
  const [row] = await db.select().from(projects).where(eq(projects.id, id))
  return row
}
