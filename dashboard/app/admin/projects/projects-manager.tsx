"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Project {
  id: string
  name: string
  slug: string
  repoPath: string
  description: string
  isActive: number
}

export function ProjectsManager() {
  const [rows, setRows] = useState<Project[]>([])
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [repoPath, setRepoPath] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const res = await fetch("/api/admin/projects")
    const data = await res.json()
    setRows(data.projects ?? [])
  }

  useEffect(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((d) => setRows(d.projects ?? []))
  }, [])

  function suggestSlug(value: string) {
    setName(value)
    setSlug(
      value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48),
    )
  }

  async function create() {
    setBusy(true)
    setError(null)
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, repoPath, description }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "Create failed")
      return
    }
    setName("")
    setSlug("")
    setRepoPath("")
    setDescription("")
    refresh()
  }

  async function toggleArchive(p: Project) {
    const res = await fetch(`/api/admin/projects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: p.isActive ? 0 : 1 }),
    })
    if (res.ok) refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>New project</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pname">Name</Label>
              <Input id="pname" value={name} onChange={(e) => suggestSlug(e.target.value)} placeholder="Acme API" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pslug">Slug</Label>
              <Input id="pslug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-api" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ppath">Repo path</Label>
            <Input id="ppath" value={repoPath} onChange={(e) => setRepoPath(e.target.value)} placeholder="docs/acme" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pdesc">Description</Label>
            <Input id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button onClick={create} disabled={busy}>
              {busy ? "Creating..." : "Create project"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Projects ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {rows.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>
                    {p.name} <span className="text-muted-foreground">/{p.slug} · {p.repoPath}</span>
                    {!p.isActive && <span className="ml-2 text-muted-foreground">(archived)</span>}
                  </span>
                  <Button variant="outline" onClick={() => toggleArchive(p)}>
                    {p.isActive ? "Archive" : "Restore"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
