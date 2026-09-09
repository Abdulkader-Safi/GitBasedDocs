import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

import { auth } from "./session"

// Page and route guard. Returns the session for admins,
// redirects everyone else to login.
export async function requireAdmin() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/login")
  return session
}

// API guard. Returns the session for admins, 401 JSON otherwise.
export async function requireAdminApi() {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { session, error: null }
}
