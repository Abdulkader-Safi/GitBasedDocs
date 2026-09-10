import { NextResponse } from "next/server"

import { auth } from "@/lib/auth/session"
import { changeOwnPassword } from "@/lib/users/users"

// Any signed-in person changing their own password, including the forced
// change after an admin created or reset the account.
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  try {
    const body = await request.json()
    await changeOwnPassword(session.user.id, String(body.current ?? ""), String(body.next ?? ""))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Change failed" }, { status: 400 })
  }
}
