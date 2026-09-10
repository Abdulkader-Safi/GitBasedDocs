import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "./options"

// Single helper for every server component and route handler.
// Returns null for missing, inactive, or deleted users.
export async function auth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.active) return null
  return session
}

// For reader pages: signed in, and past the first-login password change.
// API routes keep using auth() and answer 401 instead of redirecting.
export async function requireSession() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.mustChangePassword) redirect("/account/password")
  return session
}
