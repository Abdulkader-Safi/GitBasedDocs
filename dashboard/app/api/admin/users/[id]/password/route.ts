import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { resetPassword } from "@/lib/users/users"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminApi()
  if (error) return error
  const { id } = await params
  try {
    const body = await request.json()
    await resetPassword(id, String(body.password ?? ""))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Reset failed" }, { status: 400 })
  }
}
