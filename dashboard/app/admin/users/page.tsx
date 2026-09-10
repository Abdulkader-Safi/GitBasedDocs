import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/admin"

import { UsersManager } from "./users-manager"

export const metadata: Metadata = { title: "Users · Admin" }

export default async function UsersPage() {
  const session = await requireAdmin()
  return (
    <div className="flex flex-col gap-6">
      <UsersManager currentUserId={session.user.id} />
    </div>
  )
}
