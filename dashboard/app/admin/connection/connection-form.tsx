"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorText, Field } from "@/components/ui/field"
import { StatusBadge, type ConnectionStatus } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { relativeTime } from "@/lib/format"
import {
  IconBranch,
  IconCheck,
  IconClose,
  IconCopy,
  IconLink,
  IconRefresh,
  IconRepo,
} from "@/components/icons"

interface Check {
  name: string
  ok: boolean
  message: string
}

interface Connection {
  owner: string
  repo: string
  branch: string
  docsRoot: string
  status: string
  lastSyncedSha: string | null
  lastCheckedAt: string | null
  lastError: string | null
}

const CHECK_LABELS: Record<string, string> = {
  auth: "Token identity",
  repo: "Branch and sha",
  docs: "Markdown files",
}

export function ConnectionForm({ webhookUrl }: { webhookUrl: string }) {
  const [owner, setOwner] = useState("")
  const [repo, setRepo] = useState("")
  const [branch, setBranch] = useState("main")
  const [docsRoot, setDocsRoot] = useState("")
  const [connection, setConnection] = useState<Connection | null>(null)
  const [checks, setChecks] = useState<Check[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState<"save" | "test" | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/admin/connection")
      .then((r) => r.json())
      .then((d) => {
        if (d.connection) apply(d.connection)
        setLoaded(true)
      })
  }, [])

  function apply(c: Connection) {
    setConnection(c)
    setOwner(c.owner)
    setRepo(c.repo)
    setBranch(c.branch)
    setDocsRoot(c.docsRoot ?? "")
  }

  const values = { owner, repo, branch, docsRoot }

  async function save() {
    setBusy("save")
    setError(null)
    setSaved(false)
    const res = await fetch("/api/admin/connection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    setBusy(null)
    if (!res.ok) {
      setError(data.error ?? "Save failed")
      return
    }
    apply(data.connection)
    // Retargeting clears the old checks, so do not leave stale ticks on screen.
    setChecks([])
    setSaved(true)
  }

  async function test() {
    setBusy("test")
    setError(null)
    setSaved(false)
    const res = await fetch("/api/admin/connection/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    setBusy(null)
    setChecks(data.results ?? [])
    const fresh = await fetch("/api/admin/connection").then((r) => r.json())
    if (fresh.connection) setConnection(fresh.connection)
  }

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard denied. Leave the label alone rather than lying about it.
    }
  }

  if (!loaded) {
    return (
      <p className="font-mono text-[13px] text-muted-foreground">Loading...</p>
    )
  }

  const badge: ConnectionStatus | null =
    !connection || !connection.lastCheckedAt
      ? null
      : connection.status === "error"
        ? "error"
        : connection.status === "syncing"
          ? "syncing"
          : "connected"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="GitHub connection"
        description="One private repo serves every project"
      />

      <section className="border border-border bg-card">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <IconRepo size={17} />
          <h2 className="font-heading text-base font-medium">Repository</h2>
          <div className="ms-auto">
            {badge ? (
              <StatusBadge status={badge} />
            ) : (
              <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Not tested yet
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner" htmlFor="owner">
              <Input
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="octocat"
              />
            </Field>
            <Field label="Repo" htmlFor="repo">
              <Input
                id="repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="docs"
              />
            </Field>
            <Field label="Branch" htmlFor="branch">
              <Input
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
              />
            </Field>
            <Field
              label="Subfolder (optional)"
              htmlFor="docsRoot"
              hint="Leave empty to index the whole repo."
            >
              <Input
                id="docsRoot"
                value={docsRoot}
                onChange={(e) => setDocsRoot(e.target.value)}
                placeholder="whole repo"
              />
            </Field>
          </div>

          <p className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
            <IconLink size={13} className="mt-0.5 shrink-0" />
            Token and webhook secret come from env (GITHUB_TOKEN,
            GITHUB_WEBHOOK_SECRET). They never appear here.
          </p>

          {error && <ErrorText>{error}</ErrorText>}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={busy !== null}>
              <IconCheck size={16} />
              {busy === "save" ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={test}
              disabled={busy !== null}
            >
              <IconRefresh size={16} />
              {busy === "test" ? "Working..." : "Test connection"}
            </Button>

            {saved && connection && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-status-success">
                <IconCheck size={13} />
                Saved {connection.owner}/{connection.repo} on{" "}
                {connection.branch}
              </span>
            )}
          </div>

          {checks.length > 0 && (
            <ul className="border border-border">
              {checks.map((c, i) => (
                <li
                  key={c.name}
                  className={`flex items-start gap-2.5 bg-muted px-3.5 py-2.5 ${
                    i > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <span
                    className={`mt-px flex size-[18px] shrink-0 items-center justify-center ${
                      c.ok ? "bg-status-success" : "bg-destructive"
                    }`}
                  >
                    {c.ok ? (
                      <IconCheck size={12} className="text-background" />
                    ) : (
                      <IconClose size={12} className="text-background" />
                    )}
                  </span>
                  <span className="font-mono text-[13px] font-medium">
                    {CHECK_LABELS[c.name] ?? c.name}
                  </span>
                  <span
                    className={`font-mono text-[13px] ${
                      c.ok ? "text-muted-foreground" : "text-destructive"
                    }`}
                  >
                    {c.message}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {connection?.lastCheckedAt && (
            <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <IconBranch size={12} />
                {connection.lastSyncedSha
                  ? connection.lastSyncedSha.slice(0, 7)
                  : "never synced"}
              </span>
              <span>
                checked {relativeTime(new Date(connection.lastCheckedAt))}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 border border-border bg-card px-5 py-5">
        <div className="flex items-center gap-2.5">
          <IconLink size={15} />
          <h2 className="font-heading text-base font-medium">Webhook URL</h2>
        </div>
        <div className="flex items-center gap-2 border border-border bg-muted py-2 ps-3 pe-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[13px]">
            {webhookUrl}
          </span>
          <Button variant="outline" size="sm" onClick={copyWebhook}>
            {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Add this in the repo settings under Webhooks, content type
          application/json, secret GITHUB_WEBHOOK_SECRET, push events only.
        </p>
      </section>
    </div>
  )
}
