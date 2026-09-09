import { requireAdmin } from "@/lib/auth/admin"

import { ConnectionForm } from "./connection-form"

export default async function ConnectionPage() {
  await requireAdmin()
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <ConnectionForm />
    </div>
  )
}
