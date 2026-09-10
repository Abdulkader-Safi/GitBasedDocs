import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { revokeSessions } from "@/lib/users/users"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminApi()
  if (error) return error
  const { id } = await params
  await revokeSessions(id)
  return NextResponse.json({ ok: true })
}
