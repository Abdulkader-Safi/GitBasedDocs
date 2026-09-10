"use client"

import { useEffect, useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorText, Field } from "@/components/ui/field"
import { PageHeader } from "@/components/ui/page-header"
import {
  IconArchive,
  IconChevronDown,
  IconFolder,
  IconPlus,
  IconRefresh,
  IconRepo,
  IconTrash,
  IconUser,
} from "@/components/icons"

interface Project {
  id: string
  name: string
  slug: string
  repoPath: string
  description: string
  isActive: number
  pageCount: number
  memberCount: number
}

interface Member {
  userId: string
  name: string | null
  email: string
  role: string
  isActive: boolean
}

interface Candidate {
  id: string
  name: string | null
  email: string
  role: string
}

const selectClass =
  "h-9 min-w-0 flex-1 border border-input bg-background px-3 font-mono text-[13px] text-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"

function MembersPanel({ project, onChange }: { project: Project; onChange: () => void }) {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [pick, setPick] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/projects/${project.id}/members`)
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.members ?? [])
        setCandidates(d.candidates ?? [])
      })
  }, [project.id])

  async function add() {
    if (!pick) return
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/admin/projects/${project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: pick }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "Could not add")
      return
    }
    setMembers(data.members)
    setPick("")
    onChange()
  }

  async function remove(userId: string) {
    setBusy(true)
    const res = await fetch(`/api/admin/projects/${project.id}/members?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    })
    const data = await res.json()
    setBusy(false)
    if (res.ok) {
      setMembers(data.members)
      onChange()
    }
  }

  if (members === null) {
    return <p className="px-5 py-3 font-mono text-xs text-muted-foreground">Loading...</p>
  }

  const memberIds = new Set(members.map((m) => m.userId))
  const available = candidates.filter((c) => !memberIds.has(c.id))

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-5 py-4">
      {members.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">
          No one has access yet. Admins see every project without being added.
        </p>
      ) : (
        <ul className="flex flex-col border border-border bg-card">
          {members.map((m, i) => (
            <li
              key={m.userId}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2",
                i > 0 && "border-t border-border",
                !m.isActive && "opacity-50",
              )}
            >
              <IconUser size={14} className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate font-mono text-[13px]">
                {m.name ? `${m.name} · ` : ""}
                {m.email}
              </span>
              <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                {m.isActive ? m.role : "deactivated"}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${m.email}`}
                onClick={() => remove(m.userId)}
                disabled={busy}
                className="ms-auto text-muted-foreground hover:text-destructive"
              >
                <IconTrash size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {candidates.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">
          There are no viewer or editor accounts to add yet.
        </p>
      ) : available.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">Everyone who can be added already has access.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`add-${project.id}`} className="sr-only">
            Person to add
          </label>
          <select
            id={`add-${project.id}`}
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className={selectClass}
          >
            <option value="">Choose a person...</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ? `${c.name} (${c.email})` : c.email} · {c.role}
              </option>
            ))}
          </select>
          <Button onClick={add} disabled={busy || !pick}>
            <IconPlus size={15} />
            Give access
          </Button>
        </div>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  )
}

export function ProjectsManager() {
  const [rows, setRows] = useState<Project[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
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
      .then((d) => {
        setRows(d.projects ?? [])
        setLoaded(true)
      })
  }, [])

  // Typing the name fills the slug; the slug stays editable.
  function suggestSlug(value: string) {
    setName(value)
    setSlug(value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48))
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
    <div className="flex flex-col gap-6">
      <PageHeader title="Projects" description="One project maps to one folder in the content repo" />

      <section className="border border-border bg-card">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <IconPlus size={17} />
          <h2 className="font-heading text-base font-medium">New project</h2>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="pname">
              <Input id="pname" value={name} onChange={(e) => suggestSlug(e.target.value)} placeholder="Acme API" />
            </Field>
            <Field label="Slug" htmlFor="pslug">
              <Input id="pslug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-api" />
            </Field>
          </div>
          <Field label="Repo path" htmlFor="ppath" hint="A folder in the repo, or leave empty for the whole repo.">
            <Input id="ppath" value={repoPath} onChange={(e) => setRepoPath(e.target.value)} placeholder="whole repo" />
          </Field>
          <Field label="Description" htmlFor="pdesc">
            <Input id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          {error && <ErrorText>{error}</ErrorText>}
          <div>
            <Button onClick={create} disabled={busy}>
              <IconPlus size={16} />
              {busy ? "Creating..." : "Create project"}
            </Button>
          </div>
        </div>
      </section>

      <section className="border border-border bg-card">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <IconFolder size={17} />
          <h2 className="font-heading text-base font-medium">Projects ({rows.length})</h2>
        </div>
        {!loaded ? (
          <p className="px-5 py-4 font-mono text-xs text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-4 font-mono text-[13px] text-muted-foreground">No projects yet.</p>
        ) : (
          <ul>
            {rows.map((p, i) => (
              <li key={p.id} className={cn(i > 0 && "border-t border-border")}>
                <div className={cn("flex flex-wrap items-center gap-3 px-5 py-3", !p.isActive && "opacity-60")}>
                  <IconRepo size={15} className="shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-medium">{p.name}</span>
                      {!p.isActive && (
                        <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                          <IconArchive size={10} />
                          Archived
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      /{p.slug} · {p.repoPath || "whole repo"} · {p.pageCount} {p.pageCount === 1 ? "page" : "pages"}
                    </span>
                  </div>
                  <div className="ms-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-expanded={open === p.id}
                      onClick={() => setOpen(open === p.id ? null : p.id)}
                    >
                      <IconUser size={14} />
                      Members ({p.memberCount})
                      <IconChevronDown
                        size={12}
                        className={cn("transition-transform", open === p.id && "rotate-180")}
                      />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleArchive(p)}>
                      {p.isActive ? <IconArchive size={14} /> : <IconRefresh size={14} />}
                      {p.isActive ? "Archive" : "Restore"}
                    </Button>
                  </div>
                </div>
                {open === p.id && <MembersPanel project={p} onChange={refresh} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
