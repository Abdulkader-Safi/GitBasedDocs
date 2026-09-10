"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorText } from "@/components/ui/field"
import { relativeTime } from "@/lib/format"
import {
  IconArchive,
  IconCheck,
  IconClose,
  IconRefresh,
  IconTrash,
  IconUser,
} from "@/components/icons"

interface ProjectChoice {
  id: string
  name: string
  slug: string
}

interface AuditLine {
  id: string
  actorEmail: string
  action: string
  detail: string
  createdAt: string
}

type Action = "archive" | "purge" | "cache"

const selectClass =
  "h-8 border border-input bg-background px-2.5 font-mono text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"

const ACTION_LABEL: Record<string, string> = {
  "project.archive": "Archived project",
  "project.restore": "Restored project",
  "pages.purge": "Purged pages",
  "cache.clear": "Cleared HTML cache",
}

// One row: what it does, then a typed confirm that only arms the button
// once the phrase matches. The server checks the phrase again.
function DangerRow({
  icon,
  title,
  body,
  phrase,
  button,
  onRun,
  extra,
  disabled,
  defaultOpen = false,
}: {
  icon: React.ReactNode
  title: string
  body: string
  phrase: string
  button: string
  onRun: (typed: string) => Promise<{ ok: boolean; message: string }>
  extra?: React.ReactNode
  disabled?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function run(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await onRun(typed).catch(() => ({
      ok: false,
      message: "Action failed.",
    }))
    setBusy(false)
    if (!result.ok) return setError(result.message)
    setDone(result.message)
    setOpen(false)
    setTyped("")
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-0.5 text-destructive">{icon}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-heading text-sm font-medium">{title}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {body}
          </span>
          {done && (
            <span className="flex items-center gap-1.5 font-mono text-xs text-status-success">
              <IconCheck size={12} />
              {done}
            </span>
          )}
        </div>
        {!open && (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              setOpen(true)
              setDone(null)
            }}
            className="text-destructive"
          >
            {icon}
            {button}
          </Button>
        )}
      </div>

      {open && (
        <form
          onSubmit={run}
          className="ms-7 flex flex-col gap-2.5 border border-dashed border-destructive/60 px-3.5 py-3"
        >
          {extra}
          <label
            className="font-mono text-xs text-muted-foreground"
            htmlFor={`confirm-${title}`}
          >
            Type <code className="bg-muted px-1 text-foreground">{phrase}</code>{" "}
            to confirm
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id={`confirm-${title}`}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="max-w-64 font-mono"
            />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={busy || !phrase || typed.trim() !== phrase}
            >
              {icon}
              {busy ? "Working..." : button}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false)
                setTyped("")
                setError(null)
              }}
              aria-label="Cancel"
            >
              <IconClose size={14} />
            </Button>
          </div>
          {error && <ErrorText>{error}</ErrorText>}
        </form>
      )}
    </div>
  )
}

export function DangerZone({
  projects,
  audit,
  purgeDays,
  phrases,
  archiveSlug,
}: {
  projects: ProjectChoice[]
  audit: AuditLine[]
  purgeDays: number
  phrases: { purge: string; cache: string }
  // Set when arriving from a project's Archive button: that project is
  // picked and its confirm box is already open.
  archiveSlug?: string
}) {
  const router = useRouter()
  const requested = projects.find((p) => p.slug === archiveSlug)
  const [projectId, setProjectId] = useState(requested?.id ?? projects[0]?.id ?? "")
  // After an archive the picked project leaves the list; fall back to the first.
  const project = projects.find((p) => p.id === projectId) ?? projects[0]

  async function post(action: Action, confirm: string, extra: object = {}) {
    const res = await fetch("/api/admin/danger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, confirm, ...extra }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok)
      return { ok: false, message: (data.error as string) ?? "Action failed." }
    router.refresh()
    return { ok: true, message: data.detail as string }
  }

  return (
    <section className="flex flex-col border border-destructive/60 bg-card">
      <div className="divide-y divide-border">
        <DangerRow
          icon={<IconArchive size={14} />}
          title="Archive a project"
          body="Hides it from every reader and stops syncing it. Restore it later from Projects."
          phrase={project?.slug ?? ""}
          button="Archive"
          disabled={!projects.length}
          defaultOpen={Boolean(requested)}
          onRun={(typed) => post("archive", typed, { projectId: project?.id })}
          extra={
            <select
              aria-label="Project to archive"
              value={project?.id ?? ""}
              onChange={(e) => setProjectId(e.target.value)}
              className={selectClass}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
          }
        />
        <DangerRow
          icon={<IconTrash size={14} />}
          title="Purge deleted pages"
          body={`Removes pages whose files left the repo more than ${purgeDays} days ago. They cannot come back without a new commit.`}
          phrase={phrases.purge}
          button="Purge"
          onRun={(typed) => post("purge", typed)}
        />
        <DangerRow
          icon={<IconRefresh size={14} />}
          title="Clear HTML cache"
          body="Drops every rendered page so the next visit renders fresh. Pages load a little slower for a moment."
          phrase={phrases.cache}
          button="Clear cache"
          onRun={(typed) => post("cache", typed)}
        />
      </div>

      <div className="border-t border-border bg-muted px-5 py-3">
        <h3 className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Audit log
        </h3>
        {audit.length === 0 ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Nothing yet.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {audit.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-xs"
              >
                <span
                  className="w-28 shrink-0 text-muted-foreground"
                  title={a.createdAt}
                >
                  {relativeTime(new Date(a.createdAt))}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <IconUser size={12} />
                  {a.actorEmail}
                </span>
                <span className="text-foreground">
                  {ACTION_LABEL[a.action] ?? a.action}
                </span>
                {a.detail && (
                  <span className="text-muted-foreground">{a.detail}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
