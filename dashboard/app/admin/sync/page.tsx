import { desc } from "drizzle-orm"
import { cn } from "cn"

import { requireAdmin } from "@/lib/auth/admin"
import { getDb } from "@/lib/db"
import { syncLogs } from "@/lib/db/schema"
import { plural, relativeTime } from "@/lib/format"
import { PageHeader } from "@/components/ui/page-header"
import { IconBranch, IconCheck, IconChevronRight, IconClock, IconWarning } from "@/components/icons"

const COLS = "grid grid-cols-[150px_100px_150px_110px_130px_90px_1fr] items-center gap-4 px-4"
const LABEL = "font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase"

type Run = typeof syncLogs.$inferSelect

// "guides/auth.md: 404 Not Found" splits into the failing path and why.
function splitLine(line: string) {
  const m = line.match(/^(\S+\.[a-z0-9]+): (.+)$/i)
  return m ? { path: m[1], text: m[2] } : { path: null, text: line }
}

function Status({ run, issues }: { run: Run; issues: number }) {
  const [label, tone, Icon] =
    run.status === "error"
      ? ["Failed", "border-destructive text-destructive", IconWarning]
      : issues
        ? [plural(issues, "warning"), "border-status-warning text-status-warning", IconWarning]
        : run.status === "unchanged"
          ? ["No change", "border-border text-muted-foreground", IconCheck]
          : ["Synced", "border-status-success text-status-success", IconCheck]
  return (
    <span className={cn("inline-flex w-fit items-center gap-1 border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.08em] uppercase", tone)}>
      <Icon size={11} />
      {label}
    </span>
  )
}

function RunRow({ run }: { run: Run }) {
  const lines = run.errors.split("\n").filter(Boolean)
  const cells = (
    <>
      <span className="flex items-center gap-1.5 font-mono text-xs whitespace-nowrap text-muted-foreground" title={run.createdAt.toISOString()}>
        <IconClock size={12} />
        {relativeTime(run.createdAt)}
      </span>
      <span className="font-mono text-[13px] capitalize">{run.trigger}</span>
      <Status run={run} issues={lines.length} />
      <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground" title={run.headSha ?? undefined}>
        <IconBranch size={12} />
        {run.headSha ? run.headSha.slice(0, 7) : "none"}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        <span className={cn(run.added && "text-status-success")}>+{run.added}</span>{" "}
        <span className={cn(run.changed && "text-status-warning")}>~{run.changed}</span>{" "}
        <span className={cn(run.removed && "text-destructive")}>-{run.removed}</span>
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {run.durationMs < 1000 ? `${run.durationMs} ms` : `${(run.durationMs / 1000).toFixed(1)} s`}
      </span>
    </>
  )

  if (!lines.length) {
    return (
      <div className={cn(COLS, "border-t border-border py-2.5")}>
        {cells}
        <span />
      </div>
    )
  }

  // Native disclosure: no client JS for a list that only ever opens.
  return (
    <details className="group border-t border-border">
      <summary className={cn(COLS, "cursor-pointer list-none py-2.5 hover:bg-accent [&::-webkit-details-marker]:hidden")}>
        {cells}
        <span className="flex items-center justify-end gap-1 font-mono text-[11px] text-muted-foreground">
          Details
          <IconChevronRight size={12} className="transition-transform group-open:rotate-90" />
        </span>
      </summary>
      <ul className="flex flex-col gap-1.5 border-t border-dashed border-border bg-muted px-4 py-3">
        {lines.map((line, i) => {
          const { path, text } = splitLine(line)
          return (
            <li key={i} className="font-mono text-xs break-words">
              {path && <span className="text-foreground">{path}</span>}
              {path && <span className="text-muted-foreground">: </span>}
              <span className={run.status === "error" ? "text-destructive" : "text-muted-foreground"}>{text}</span>
            </li>
          )
        })}
      </ul>
    </details>
  )
}

export default async function SyncRunsPage() {
  await requireAdmin()
  const db = await getDb()
  const runs = await db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(50)

  return (
    <div className="mx-auto flex w-full max-w-[1464px] flex-col gap-6 px-6 py-8">
      <PageHeader title="Sync runs" description="Last 50 runs, newest first. Open a row to see what went wrong." />

      <div className="overflow-x-auto border border-border bg-card">
        <div className="min-w-[900px]">
          <div className={cn(COLS, "bg-muted py-2.5")}>
            {["When", "Trigger", "Status", "Commit", "Changes", "Took"].map((h) => (
              <span key={h} className={LABEL}>{h}</span>
            ))}
            <span />
          </div>
          {runs.length === 0 ? (
            <p className="border-t border-border px-4 py-6 font-mono text-[13px] text-muted-foreground">
              No sync has run yet. Start one from the admin page.
            </p>
          ) : (
            runs.map((run) => <RunRow key={run.id} run={run} />)
          )}
        </div>
      </div>
    </div>
  )
}
