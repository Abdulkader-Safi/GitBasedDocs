import type { Metadata } from "next"
import Link from "next/link"
import { desc } from "drizzle-orm"
import { cn } from "cn"

import { requireAdmin } from "@/lib/auth/admin"
import { getDb } from "@/lib/db"
import { syncLogs } from "@/lib/db/schema"
import { getConnection } from "@/lib/github/connection"
import { listProjectsWithCounts } from "@/lib/projects/projects"
import { deniedInLastDays } from "@/lib/access/log"
import { listUsers } from "@/lib/users/users"
import { intervalFromEnv } from "@/lib/sync/schedule"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge, type ConnectionStatus } from "@/components/ui/status-badge"
import { SyncPanel } from "@/components/admin/sync-panel"
import { SyncRunsTable } from "@/components/admin/sync-runs"
import { IconArrowRight } from "@/components/icons"

function Tile({
  href,
  label,
  value,
  meta,
  alert,
}: {
  href: string
  label: string
  value: React.ReactNode
  meta: string
  alert?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0 flex-col gap-2 border bg-card px-4 py-3.5 transition-colors hover:border-ring",
        alert ? "border-destructive/60" : "border-border",
      )}
    >
      <span className="flex items-center justify-between font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {label}
        <IconArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </span>
      <span className={cn("font-heading text-2xl leading-none font-semibold", alert && "text-destructive")}>{value}</span>
      <span className="truncate font-mono text-xs text-muted-foreground">{meta}</span>
    </Link>
  )
}

export const metadata: Metadata = { title: "Overview · Admin" }

export default async function AdminPage() {
  await requireAdmin()
  const db = await getDb()
  const [connection, projects, denied, people, runs] = await Promise.all([
    getConnection(),
    listProjectsWithCounts(),
    deniedInLastDays(7),
    listUsers(),
    db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(5),
  ])

  const active = projects.filter((p) => p.isActive)
  const pages = active.reduce((n, p) => n + p.pageCount, 0)
  const admins = people.filter((u) => u.role === "admin" && u.isActive).length
  const status: ConnectionStatus | null = !connection?.lastCheckedAt
    ? null
    : connection.status === "error"
      ? "error"
      : connection.status === "syncing"
        ? "syncing"
        : "connected"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" description="Connection health, content and people at a glance" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Tile
          href="/admin/connection"
          label="GitHub"
          value={status ? <StatusBadge status={status} /> : <span className="text-muted-foreground">Not set</span>}
          meta={connection ? `${connection.owner}/${connection.repo} · ${connection.branch}` : "Link a repo to start"}
          alert={status === "error"}
        />
        <Tile href="/admin/projects" label="Projects" value={active.length} meta={`${projects.length - active.length} archived`} />
        <Tile href="/admin/projects" label="Pages" value={pages} meta="in active projects" />
        <Tile href="/admin/users" label="Users" value={people.length} meta={`${admins} ${admins === 1 ? "admin" : "admins"}`} />
        <Tile href="/admin/access" label="Denied" value={denied} meta="page opens, last 7 days" alert={denied > 0} />
      </div>

      {connection ? (
        <SyncPanel intervalMinutes={intervalFromEnv(process.env.SYNC_INTERVAL_MINUTES) / 60_000} />
      ) : (
        <p className="font-mono text-xs text-muted-foreground">
          Link a repo on the <Link href="/admin/connection" className="underline underline-offset-4">connection page</Link>, then sync from here.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-medium">Recent sync runs</h2>
          <Link href="/admin/sync" className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
            All runs
            <IconArrowRight size={12} />
          </Link>
        </div>
        <SyncRunsTable runs={runs} empty="No sync has run yet." />
      </section>
    </div>
  )
}
