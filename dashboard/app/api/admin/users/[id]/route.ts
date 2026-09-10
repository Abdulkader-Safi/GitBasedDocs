import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { updateUser } from "@/lib/users/users"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAdminApi()
  if (error) return error
  const { id } = await params
  try {
    const body = await request.json()
    await updateUser(
      id,
      {
        name: body.name !== undefined ? String(body.name) : undefined,
        role: body.role !== undefined ? String(body.role) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        projectIds: Array.isArray(body.projectIds) ? body.projectIds.map(String) : undefined,
      },
      session.user.id,
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed" }, { status: 400 })
  }
}
