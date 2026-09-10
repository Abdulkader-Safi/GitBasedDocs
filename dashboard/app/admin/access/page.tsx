import Link from "next/link"
import { cn } from "cn"

import { requireAdmin } from "@/lib/auth/admin"
import { accessFilterOptions, listAccessEvents, type AccessFilter } from "@/lib/access/log"
import { relativeTime } from "@/lib/format"
import { PageHeader } from "@/components/ui/page-header"
import { buttonVariants } from "@/components/ui/button"
import { IconCheck, IconClose, IconClock, IconUser } from "@/components/icons"

type Search = Promise<{ user?: string; project?: string; result?: string }>

const selectClass =
  "h-9 border border-input bg-background px-3 font-mono text-[13px] text-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"

export default async function AccessLogPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin()
  const q = await searchParams
  const filter: AccessFilter = {
    userId: q.user || undefined,
    projectId: q.project || undefined,
    result: q.result === "allowed" || q.result === "denied" ? q.result : undefined,
  }
  const [events, options] = await Promise.all([listAccessEvents(filter), accessFilterOptions()])
  const filtered = Boolean(filter.userId || filter.projectId || filter.result)

  return (
    <div className="mx-auto flex w-full max-w-[1464px] flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Access log"
        description="Page opens and denied attempts, newest first, last 500"
      />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">User</span>
          <select name="user" defaultValue={filter.userId ?? ""} className={selectClass}>
            <option value="">Everyone</option>
            {options.users.map((u) => (
              <option key={u.id} value={u.id}>{u.email}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Project</span>
          <select name="project" defaultValue={filter.projectId ?? ""} className={selectClass}>
            <option value="">All projects</option>
            {options.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Result</span>
          <select name="result" defaultValue={filter.result ?? ""} className={selectClass}>
            <option value="">Any</option>
            <option value="allowed">Allowed</option>
            <option value="denied">Denied</option>
          </select>
        </label>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>Filter</button>
        {filtered && (
          <Link href="/admin/access" className="font-mono text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[760px] border-collapse text-start">
          <thead>
            <tr className="bg-muted">
              {["When", "User", "Project", "Path", "Result"].map((h) => (
                <th key={h} className="px-3.5 py-2.5 text-start font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3.5 py-6 font-mono text-[13px] text-muted-foreground">
                  {filtered ? "Nothing matches these filters." : "No page opens logged yet."}
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground" title={e.createdAt.toISOString()}>
                    <span className="flex items-center gap-1.5"><IconClock size={12} />{relativeTime(e.createdAt)}</span>
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-[13px]">
                    <span className="flex items-center gap-1.5"><IconUser size={13} className="text-muted-foreground" />{e.email ?? "deleted user"}</span>
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-[13px] text-muted-foreground">{e.projectName ?? "no such project"}</td>
                  <td className="max-w-[420px] truncate px-3.5 py-2.5 font-mono text-xs text-muted-foreground" title={e.path}>{e.path}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.08em] uppercase",
                        e.allowed ? "border-status-success text-status-success" : "border-destructive text-destructive",
                      )}
                    >
                      {e.allowed ? <IconCheck size={11} /> : <IconClose size={11} />}
                      {e.allowed ? "Allowed" : "Denied"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
