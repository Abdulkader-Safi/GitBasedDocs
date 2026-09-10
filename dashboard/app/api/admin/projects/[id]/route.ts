import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { updateProject } from "@/lib/projects/projects"
import { writeAudit } from "@/lib/admin/danger"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAdminApi()
  if (error) return error
  try {
    const { id } = await params
    const body = await request.json()
    // Archiving is a danger action: typed confirm plus audit line.
    if (body.isActive !== undefined && !Number(body.isActive)) {
      throw new Error("Archive projects from the danger zone on the admin page.")
    }
    const project = await updateProject(id, {
      name: body.name !== undefined ? String(body.name) : undefined,
      slug: body.slug !== undefined ? String(body.slug) : undefined,
      repoPath: body.repoPath !== undefined ? String(body.repoPath) : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      isActive: body.isActive !== undefined ? Number(body.isActive) : undefined,
    })
    if (body.isActive !== undefined) {
      await writeAudit({ id: session.user.id, email: session.user.email ?? "unknown" }, "project.restore", `${project.name} (${project.slug})`)
    }
    return NextResponse.json({ project })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
