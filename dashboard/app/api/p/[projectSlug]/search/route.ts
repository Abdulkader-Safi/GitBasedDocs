import { NextResponse, after } from "next/server"

import { auth } from "@/lib/auth/session"
import { checkProjectAccess, logAccess } from "@/lib/access/access"
import { recentPages, searchPages } from "@/lib/search/search"

type Params = Promise<{ projectSlug: string }>

// Search inside one project. Same gate and same bare 404 as pages and
// assets, so a search never confirms that a project exists.
export async function GET(request: Request, { params }: { params: Params }) {
  const { projectSlug } = await params
  const session = await auth()
  if (!session) return new NextResponse("Not found", { status: 404 })

  const { project, allowed } = await checkProjectAccess(session.user, projectSlug)
  if (!project || !allowed) {
    const userId = session.user.id
    const attempted = project?.id ?? null
    const requested = new URL(request.url).pathname
    after(() => logAccess({ userId, projectId: attempted, path: requested, allowed: false }))
    return new NextResponse("Not found", { status: 404 })
  }

  const includeDrafts = session.user.role === "admin" || session.user.role === "editor"
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 200)
  const hits = q.trim()
    ? await searchPages(project.id, q, { includeDrafts })
    : await recentPages(project.id, project.slug, session.user.id, { includeDrafts })

  return NextResponse.json({ query: q, recent: !q.trim(), hits })
}
