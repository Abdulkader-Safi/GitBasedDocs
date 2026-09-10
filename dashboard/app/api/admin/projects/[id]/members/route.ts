import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { addMember, listGrantableUsers, listMembers, removeMember } from "@/lib/access/members"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdminApi()
  if (error) return error
  const { id } = await params
  const [members, candidates] = await Promise.all([listMembers(id), listGrantableUsers()])
  return NextResponse.json({ members, candidates })
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAdminApi()
  if (error) return error
  const { id } = await params
  try {
    const body = await request.json()
    await addMember(id, String(body.userId ?? ""), session.user.id)
    return NextResponse.json({ members: await listMembers(id) }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not add" }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { error } = await requireAdminApi()
  if (error) return error
  const { id } = await params
  const userId = new URL(request.url).searchParams.get("userId") ?? ""
  await removeMember(id, userId)
  return NextResponse.json({ members: await listMembers(id) })
}
