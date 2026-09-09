import { getServerSession } from "next-auth"

import { authOptions } from "./options"

// Single helper for every server component and route handler.
// Returns null for missing, inactive, or deleted users.
export async function auth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.active) return null
  return session
}
