import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { testConnection } from "@/lib/github/connection"

export async function POST(request: Request) {
  const { error } = await requireAdminApi()
  if (error) return error
  const body = await request.json()
  const results = await testConnection({
    owner: String(body.owner ?? ""),
    repo: String(body.repo ?? ""),
    branch: String(body.branch ?? "main"),
    docsRoot: String(body.docsRoot ?? "docs"),
  })
  return NextResponse.json({ results })
}
