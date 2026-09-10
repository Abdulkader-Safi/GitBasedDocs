import type { Metadata } from "next"
import { desc } from "drizzle-orm"

import { requireAdmin } from "@/lib/auth/admin"
import { getDb } from "@/lib/db"
import { syncLogs } from "@/lib/db/schema"
import { PageHeader } from "@/components/ui/page-header"
import { SyncRunsTable } from "@/components/admin/sync-runs"

export const metadata: Metadata = { title: "Sync runs · Admin" }

export default async function SyncRunsPage() {
  await requireAdmin()
  const db = await getDb()
  const runs = await db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(50)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sync runs" description="Last 50 runs, newest first. Open a row to see what went wrong." />
      <SyncRunsTable runs={runs} empty="No sync has run yet. Start one from the overview." />
    </div>
  )
}
