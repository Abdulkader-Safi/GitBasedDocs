import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { getConnection, saveConnection } from "@/lib/github/connection"

export async function GET() {
  const { error } = await requireAdminApi()
  if (error) return error
  const connection = await getConnection()
  return NextResponse.json({ connection })
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi()
  if (error) return error
  try {
    const body = await request.json()
    const connection = await saveConnection({
      owner: String(body.owner ?? ""),
      repo: String(body.repo ?? ""),
      branch: String(body.branch ?? "main"),
      docsRoot: String(body.docsRoot ?? ""),
    })
    return NextResponse.json({ connection })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
