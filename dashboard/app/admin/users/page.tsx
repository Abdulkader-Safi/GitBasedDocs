import { requireAdmin } from "@/lib/auth/admin"

import { UsersManager } from "./users-manager"

export default async function UsersPage() {
  const session = await requireAdmin()
  return (
    <div className="mx-auto w-full max-w-[1464px] px-6 py-8">
      <UsersManager currentUserId={session.user.id} />
    </div>
  )
}
