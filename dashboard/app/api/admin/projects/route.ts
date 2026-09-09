import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { createProject, listProjects } from "@/lib/projects/projects"

export async function GET() {
  const { error } = await requireAdminApi()
  if (error) return error
  const rows = await listProjects()
  return NextResponse.json({ projects: rows })
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi()
  if (error) return error
  try {
    const body = await request.json()
    const project = await createProject({
      name: String(body.name ?? ""),
      slug: String(body.slug ?? ""),
      repoPath: String(body.repoPath ?? ""),
      description: String(body.description ?? ""),
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
