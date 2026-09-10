"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { ErrorText } from "@/components/ui/field"
import { relativeTime } from "@/lib/format"
import { IconCheck, IconClock, IconLoader, IconRefresh } from "@/components/icons"

interface SyncLog {
  trigger: string
  headSha: string | null
  added: number
  changed: number
  removed: number
  errors: string
  durationMs: number
  createdAt: string
}

interface SyncResult {
  status: "unchanged" | "synced" | "error"
  headSha: string | null
  added: number
  changed: number
  removed: number
  errors: string[]
  durationMs: number
}

type Phase = "idle" | "queued" | "running" | "done" | "error"

const counts = (r: { added: number; changed: number; removed: number }) =>
  `+${r.added} ~${r.changed} -${r.removed}`
const short = (sha: string | null) => (sha ? sha.slice(0, 7) : "unknown")

export function SyncPanel({ intervalMinutes }: { intervalMinutes: number }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [last, setLast] = useState<SyncLog | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    fetch("/api/admin/sync")
      .then((r) => r.json())
      .then((d) => {
        setLast(d.last)
        if (d.syncing) setPhase("running")
      })
  }, [])

  async function syncNow() {
    setResult(null)
    // Ask first, so a click during someone else's run reads as queued.
    const state = await fetch("/api/admin/sync").then((r) => r.json())
    setPhase(state.syncing ? "queued" : "running")

    const res = await fetch("/api/admin/sync", { method: "POST" })
    if (!res.ok) {
      setResult({ status: "error", headSha: null, added: 0, changed: 0, removed: 0, errors: ["Sync request failed"], durationMs: 0 })
      setPhase("error")
      return
    }
    const data = (await res.json()) as { result: SyncResult }
    setResult(data.result)
    setPhase(data.result.status === "error" ? "error" : "done")
    const fresh = await fetch("/api/admin/sync").then((r) => r.json())
    setLast(fresh.last)
  }

  const busy = phase === "queued" || phase === "running"

  return (
    <section className="flex flex-col gap-4 border border-border bg-card px-5 py-5">
      <div className="flex items-center gap-2.5">
        <IconRefresh size={15} />
        <h2 className="font-heading text-base font-medium">Sync</h2>
        <span className="ms-auto flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <IconClock size={12} />
          Checks GitHub every {intervalMinutes} minutes on its own
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={syncNow} disabled={busy}>
          {busy ? <IconLoader size={16} className="animate-spin" /> : <IconRefresh size={16} />}
          {busy ? "Syncing..." : "Sync now"}
        </Button>

        {phase === "queued" && (
          <span className="font-mono text-xs text-muted-foreground">
            Queued behind the run already in progress.
          </span>
        )}
        {phase === "running" && (
          <span className="font-mono text-xs text-muted-foreground">
            Running. A large repo can take a minute.
          </span>
        )}
        {phase === "done" && result && (
          <span className="flex items-center gap-1.5 font-mono text-xs text-status-success">
            <IconCheck size={13} />
            {result.status === "unchanged"
              ? `Up to date at ${short(result.headSha)}.`
              : `Synced ${short(result.headSha)}: ${counts(result)} in ${(result.durationMs / 1000).toFixed(1)}s.`}
          </span>
        )}
      </div>

      {phase === "error" && result && <ErrorText>{result.errors[0] ?? "Sync failed"}</ErrorText>}

      {last && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          <span>Last run {relativeTime(new Date(last.createdAt))}</span>
          <span>{last.trigger}</span>
          <span>{short(last.headSha)}</span>
          <span>{counts(last)}</span>
          {last.errors && <span className="text-destructive">{last.errors.split("\n")[0]}</span>}
        </p>
      )}
    </section>
  )
}
