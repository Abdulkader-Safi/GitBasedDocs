import { readFile } from "node:fs/promises"
import { and, eq } from "drizzle-orm"

import { auth } from "@/lib/auth/session"
import { requireProjectAccess } from "@/lib/access/access"
import { getDb } from "@/lib/db"
import { assets } from "@/lib/db/schema"
import { assetFile } from "@/lib/sync/assets"

type Params = Promise<{ projectSlug: string; path: string[] }>

function decodeSegment(s: string) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

// Every miss is the same bare 404: no session, no access, no such file.
// Status codes never reveal which projects or files exist.
const notFound = () => new Response("Not found", { status: 404 })

export async function GET(request: Request, { params }: { params: Params }) {
  const { projectSlug, path } = await params
  const session = await auth()
  if (!session) return notFound()

  // Checked on every request, cached or not, so removing a member cuts off
  // their images on the next load too.
  const project = await requireProjectAccess(session.user, projectSlug)
  if (!project) return notFound()

  const repoPath = path.map(decodeSegment).join("/")
  const db = await getDb()
  const [row] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.projectId, project.id), eq(assets.repoPath, repoPath)))
  if (!row) return notFound()

  const file = assetFile(row.hash)
  if (!file) return notFound()

  const etag = `"${row.hash}"`
  const headers = new Headers({
    "Content-Type": row.mimeType,
    ETag: etag,
    // The URL is the file's path, and a path's content changes on edit, so
    // the browser keeps a copy but revalidates each time. That revalidation
    // is also where the access check above runs.
    "Cache-Control": "private, no-cache",
    "X-Content-Type-Options": "nosniff",
    // Opening an SVG straight from our origin would run any script in it.
    // A sandboxed, script-free policy keeps a hostile SVG inert.
    "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    "Content-Disposition": "inline",
  })

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers })
  }

  let bytes: Buffer
  try {
    bytes = await readFile(file)
  } catch {
    // Row without a file: the next sync fetches it again.
    return notFound()
  }
  headers.set("Content-Length", String(bytes.length))
  return new Response(new Uint8Array(bytes), { headers })
}
