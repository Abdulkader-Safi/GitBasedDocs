import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { archiveProject, clearHtmlCache, purgeDeletedPages } from "@/lib/admin/danger"

export async function POST(request: Request) {
  const { session, error } = await requireAdminApi()
  if (error) return error
  const actor = { id: session.user.id, email: session.user.email ?? "unknown" }
  const body = (await request.json().catch(() => ({}))) as { action?: string; projectId?: string; confirm?: string }
  const typed = String(body.confirm ?? "")
  try {
    if (body.action === "archive") return NextResponse.json(await archiveProject(String(body.projectId ?? ""), typed, actor))
    if (body.action === "purge") return NextResponse.json(await purgeDeletedPages(typed, actor))
    if (body.action === "cache") return NextResponse.json(await clearHtmlCache(typed, actor))
    return NextResponse.json({ error: "Unknown action." }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Action failed." }, { status: 400 })
  }
}
