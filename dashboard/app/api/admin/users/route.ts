import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { createUser, listProjectChoices, listUsers } from "@/lib/users/users"

export async function GET() {
  const { error } = await requireAdminApi()
  if (error) return error
  const [users, projects] = await Promise.all([listUsers(), listProjectChoices()])
  return NextResponse.json({ users, projects })
}

export async function POST(request: Request) {
  const { session, error } = await requireAdminApi()
  if (error) return error
  try {
    const body = await request.json()
    const id = await createUser(
      {
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
        role: String(body.role ?? ""),
        projectIds: Array.isArray(body.projectIds) ? body.projectIds.map(String) : [],
      },
      session.user.id,
    )
    return NextResponse.json({ id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 400 })
  }
}
