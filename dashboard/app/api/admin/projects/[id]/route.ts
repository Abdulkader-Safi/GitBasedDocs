import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { updateProject } from "@/lib/projects/projects"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi()
  if (error) return error
  try {
    const { id } = await params
    const body = await request.json()
    const project = await updateProject(id, {
      name: body.name !== undefined ? String(body.name) : undefined,
      slug: body.slug !== undefined ? String(body.slug) : undefined,
      repoPath: body.repoPath !== undefined ? String(body.repoPath) : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      isActive: body.isActive !== undefined ? Number(body.isActive) : undefined,
    })
    return NextResponse.json({ project })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
