import Link from "next/link"

import { requireAdmin } from "@/lib/auth/admin"
import { getConnection } from "@/lib/github/connection"
import { listProjects } from "@/lib/projects/projects"
import { deniedInLastDays } from "@/lib/access/log"
import { listUsers } from "@/lib/users/users"
import { intervalFromEnv } from "@/lib/sync/schedule"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge, type ConnectionStatus } from "@/components/ui/status-badge"
import { SyncPanel } from "@/components/admin/sync-panel"
import { IconArrowRight, IconFolder, IconRepo, IconShieldCheck, IconUser } from "@/components/icons"

function AdminCard({
  href,
  icon,
  title,
  meta,
  trailing,
}: {
  href: string
  icon: React.ReactNode
  title: string
  meta: string
  trailing?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 border border-border bg-card px-5 py-4 transition-colors hover:border-ring"
    >
      <span className="flex size-9 shrink-0 items-center justify-center bg-muted">{icon}</span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-heading text-base font-medium text-foreground">{title}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">{meta}</span>
      </span>
      <span className="ms-auto flex shrink-0 items-center gap-3">
        {trailing}
        <IconArrowRight
          size={16}
          className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  )
}

export default async function AdminPage() {
  await requireAdmin()
  const [connection, projects, denied, people] = await Promise.all([
    getConnection(),
    listProjects(),
    deniedInLastDays(7),
    listUsers(),
  ])
  const admins = people.filter((u) => u.role === "admin" && u.isActive).length

  const active = projects.filter((p) => p.isActive).length
  const archived = projects.length - active

  const status: ConnectionStatus | null = !connection?.lastCheckedAt
    ? null
    : connection.status === "error"
      ? "error"
      : connection.status === "syncing"
        ? "syncing"
        : "connected"

  return (
    <div className="mx-auto flex w-full max-w-[896px] flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Admin"
        description="Connection health, projects and sync"
      />

      <div className="flex flex-col gap-3">
        <AdminCard
          href="/admin/connection"
          icon={<IconRepo size={17} />}
          title="GitHub connection"
          meta={
            connection
              ? `${connection.owner}/${connection.repo} · ${connection.branch}`
              : "No repo linked yet"
          }
          trailing={
            status ? (
              <StatusBadge status={status} />
            ) : (
              <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                {connection ? "Not tested yet" : "Set up"}
              </span>
            )
          }
        />
        <AdminCard
          href="/admin/projects"
          icon={<IconFolder size={17} />}
          title="Projects"
          meta={`${active} active · ${archived} archived`}
        />
        <AdminCard
          href="/admin/users"
          icon={<IconUser size={17} />}
          title="Users"
          meta={`${people.length} ${people.length === 1 ? "account" : "accounts"} · ${admins} ${admins === 1 ? "admin" : "admins"}`}
        />
        <AdminCard
          href="/admin/access"
          icon={<IconShieldCheck size={17} />}
          title="Access log"
          meta={`${denied} denied ${denied === 1 ? "attempt" : "attempts"} in the last 7 days`}
        />
      </div>

      {connection ? (
        <SyncPanel intervalMinutes={intervalFromEnv(process.env.SYNC_INTERVAL_MINUTES) / 60_000} />
      ) : (
        <p className="font-mono text-xs text-muted-foreground">
          Link a repo on the GitHub connection page, then sync from here.
        </p>
      )}
    </div>
  )
}
