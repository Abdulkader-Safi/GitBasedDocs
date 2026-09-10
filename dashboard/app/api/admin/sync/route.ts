import { desc } from "drizzle-orm"
import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/admin"
import { getDb } from "@/lib/db"
import { syncLogs } from "@/lib/db/schema"
import { isSyncing, runSync } from "@/lib/sync/sync"

// Current state for the Sync now control: is a run in flight, and how did
// the last one go.
export async function GET() {
  const { error } = await requireAdminApi()
  if (error) return error
  const db = await getDb()
  const [last] = await db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(1)
  return NextResponse.json({ syncing: isSyncing(), last: last ?? null })
}

// Runs a sync and answers when it finishes. A click while a run is already in
// flight joins that run instead of starting a second one.
export async function POST() {
  const { error } = await requireAdminApi()
  if (error) return error
  const joined = isSyncing()
  const result = await runSync("manual")
  return NextResponse.json({ joined, result })
}
