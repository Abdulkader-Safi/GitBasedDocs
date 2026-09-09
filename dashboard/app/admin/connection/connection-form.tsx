"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Check {
  name: string
  ok: boolean
  message: string
}

export function ConnectionForm() {
  const [owner, setOwner] = useState("")
  const [repo, setRepo] = useState("")
  const [branch, setBranch] = useState("main")
  const [docsRoot, setDocsRoot] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [checks, setChecks] = useState<Check[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/admin/connection")
      .then((r) => r.json())
      .then((d) => {
        if (d.connection) {
          setOwner(d.connection.owner)
          setRepo(d.connection.repo)
          setBranch(d.connection.branch)
          setDocsRoot(d.connection.docsRoot)
          setStatus(d.connection.status)
        }
        setLoaded(true)
      })
  }, [])

  const values = { owner, repo, branch, docsRoot }

  async function save() {
    setBusy(true)
    setError(null)
    const res = await fetch("/api/admin/connection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "Save failed")
      return
    }
    setStatus(data.connection.status)
  }

  async function test() {
    setBusy(true)
    setError(null)
    const res = await fetch("/api/admin/connection/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    setBusy(false)
    setChecks(data.results ?? [])
  }

  if (!loaded) return <p className="text-sm text-muted-foreground">Loading...</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          GitHub connection
          {status && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({status})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="owner">Owner</Label>
            <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="octocat" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="repo">Repo</Label>
            <Input id="repo" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="docs" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="branch">Branch</Label>
            <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="docsRoot">Subfolder (optional)</Label>
            <Input id="docsRoot" value={docsRoot} onChange={(e) => setDocsRoot(e.target.value)} placeholder="whole repo" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Token and webhook secret come from env (GITHUB_TOKEN, GITHUB_WEBHOOK_SECRET). They never appear here.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save} disabled={busy}>Save</Button>
          <Button variant="outline" onClick={test} disabled={busy}>
            {busy ? "Working..." : "Test connection"}
          </Button>
        </div>
        {checks.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {checks.map((c) => (
              <li key={c.name}>
                {c.ok ? "✓" : "✗"} {c.name}: {c.message}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
