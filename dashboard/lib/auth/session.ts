import { getServerSession } from "next-auth"

import { authOptions } from "./options"

// Single helper for every server component and route handler.
export function auth() {
  return getServerSession(authOptions)
}
