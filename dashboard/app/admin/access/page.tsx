import Link from "next/link"
import { cn } from "cn"

import { requireAdmin } from "@/lib/auth/admin"
import { accessFilterOptions, listAccessEvents, type AccessFilter } from "@/lib/access/log"
import { relativeTime } from "@/lib/format"
import { PageHeader } from "@/components/ui/page-header"
import { Chip } from "@/components/ui/status-badge"
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
    <div className="flex flex-col gap-6">
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

      {/* Table from md up; below that each event is a stacked row. */}
      <div className="hidden border border-border bg-card md:block">
        <table className="w-full table-fixed border-collapse text-start">
          <thead>
            <tr className="bg-muted">
              {[
                ["When", "w-36"],
                ["User", "w-[28%]"],
                ["Project", "w-[16%]"],
                ["Path", ""],
                ["Result", "w-28"],
              ].map(([h, w]) => (
                <th key={h} className={cn(w, "px-3.5 py-2.5 text-start font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase")}>
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
                  <td className="truncate px-3.5 py-2.5 font-mono text-[13px]" title={e.email ?? undefined}>
                    <span className="flex min-w-0 items-center gap-1.5"><IconUser size={13} className="shrink-0 text-muted-foreground" /><span className="truncate">{e.email ?? "deleted user"}</span></span>
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-[13px] text-muted-foreground">{e.projectName ?? "no such project"}</td>
                  <td className="truncate px-3.5 py-2.5 font-mono text-xs text-muted-foreground" title={e.path}>{e.path}</td>
                  <td className="px-3.5 py-2.5">
                    <Result allowed={Boolean(e.allowed)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col border border-border bg-card md:hidden">
        {events.length === 0 ? (
          <li className="px-4 py-6 font-mono text-[13px] text-muted-foreground">
            {filtered ? "Nothing matches these filters." : "No page opens logged yet."}
          </li>
        ) : (
          events.map((e) => (
            <li key={e.id} className="flex flex-col gap-1.5 border-t border-border px-4 py-3 first:border-t-0">
              <span className="flex items-center justify-between gap-2">
                <Result allowed={Boolean(e.allowed)} />
                <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground" title={e.createdAt.toISOString()}>
                  <IconClock size={12} />
                  {relativeTime(e.createdAt)}
                </span>
              </span>
              <span className="truncate font-mono text-[13px]">{e.email ?? "deleted user"}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {e.projectName ?? "no such project"} · {e.path}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

function Result({ allowed }: { allowed: boolean }) {
  return (
    <Chip tone={allowed ? "success" : "danger"}>
      {allowed ? <IconCheck size={11} /> : <IconClose size={11} />}
      {allowed ? "Allowed" : "Denied"}
    </Chip>
  )
}
