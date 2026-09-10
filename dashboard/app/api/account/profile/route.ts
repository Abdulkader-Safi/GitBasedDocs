import { NextResponse } from "next/server"

import { auth } from "@/lib/auth/session"
import { updateOwnProfile } from "@/lib/users/users"

// Any signed-in person changing their own name or email. A new email needs
// the current password (checked in updateOwnProfile).
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user.active) return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  try {
    const body = await request.json()
    await updateOwnProfile(session.user.id, {
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      currentPassword: body.currentPassword ? String(body.currentPassword) : undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Save failed" }, { status: 400 })
  }
}
