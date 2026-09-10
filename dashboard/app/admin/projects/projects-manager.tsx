"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { cn } from "cn"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorText, Field } from "@/components/ui/field"
import { PageHeader } from "@/components/ui/page-header"
import {
  IconArchive,
  IconCheck,
  IconChevronDown,
  IconClose,
  IconEdit,
  IconEye,
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

type DialogMode = { kind: "create" } | { kind: "edit"; project: Project }

function ProjectDialog({ mode, onClose, onSaved }: { mode: DialogMode; onClose: () => void; onSaved: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const editing = mode.kind === "edit" ? mode.project : null
  const [name, setName] = useState(editing?.name ?? "")
  const [slug, setSlug] = useState(editing?.slug ?? "")
  const [repoPath, setRepoPath] = useState(editing?.repoPath ?? "")
  const [description, setDescription] = useState(editing?.description ?? "")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // showModal focuses the close button; start on the first field instead.
  useEffect(() => {
    ref.current?.showModal()
    ref.current?.querySelector("input")?.focus()
  }, [])

  // On create, typing the name fills the slug; the slug stays editable.
  function onName(value: string) {
    setName(value)
    if (!editing) setSlug(value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch(editing ? `/api/admin/projects/${editing.id}` : "/api/admin/projects", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, repoPath, description }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "Save failed")
      return
    }
    onSaved()
    ref.current?.close()
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="fixed inset-x-0 mx-auto mt-[10vh] mb-auto w-[calc(100%-2rem)] max-w-[520px] border border-border bg-popover p-0 text-foreground shadow-2xl backdrop:bg-black/50"
    >
      <form onSubmit={save} className="flex flex-col gap-4 px-6 py-5">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 truncate font-heading text-base font-medium">
            {editing ? `Edit ${editing.name}` : "New project"}
          </h2>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="ms-auto text-muted-foreground hover:text-foreground">
            <IconClose size={16} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="pname">
            <Input id="pname" required value={name} onChange={(e) => onName(e.target.value)} placeholder="Acme API" />
          </Field>
          <Field label="Slug" htmlFor="pslug" hint={editing ? "Changing it changes every link to this project." : undefined}>
            <Input id="pslug" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-api" />
          </Field>
        </div>
        <Field label="Repo path" htmlFor="ppath" hint="A folder in the repo, or leave empty for the whole repo.">
          <Input id="ppath" value={repoPath} onChange={(e) => setRepoPath(e.target.value)} placeholder="whole repo" />
        </Field>
        <Field label="Description" htmlFor="pdesc" hint="Shown on the reader home card.">
          <Input id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            <IconCheck size={16} />
            {busy ? "Saving..." : editing ? "Save" : "Create project"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>
            Cancel
          </Button>
        </div>
      </form>
    </dialog>
  )
}

export function ProjectsManager() {
  const [rows, setRows] = useState<Project[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [mode, setMode] = useState<DialogMode | null>(null)

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

  // Archiving lives in the danger zone; bringing a project back is safe.
  async function restore(p: Project) {
    const res = await fetch(`/api/admin/projects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: 1 }),
    })
    if (res.ok) refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        description="One project maps to one folder in the content repo"
        actions={
          <Button onClick={() => setMode({ kind: "create" })}>
            <IconPlus size={16} />
            New project
          </Button>
        }
      />

      <section className="border border-border bg-card">
        {!loaded ? (
          <p className="px-5 py-4 font-mono text-xs text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-5 py-6">
            <p className="font-mono text-[13px] text-muted-foreground">No projects yet. A project turns a folder of Markdown into a docs site.</p>
            <Button variant="outline" onClick={() => setMode({ kind: "create" })}>
              <IconPlus size={15} />
              Create the first one
            </Button>
          </div>
        ) : (
          <ul>
            {rows.map((p, i) => (
              <li key={p.id} className={cn(i > 0 && "border-t border-border")}>
                <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2.5 px-5 py-3.5", !p.isActive && "opacity-60")}>
                  <span className="flex size-8 shrink-0 items-center justify-center bg-muted">
                    <IconRepo size={15} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-mono text-[13px] font-medium">{p.name}</span>
                      {!p.isActive && (
                        <span className="flex items-center gap-1 border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                          <IconArchive size={10} />
                          Archived
                        </span>
                      )}
                    </span>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      /p/{p.slug} · {p.repoPath || "whole repo"} · {p.pageCount} {p.pageCount === 1 ? "page" : "pages"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.isActive && (
                      <Link href={`/p/${p.slug}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        <IconEye size={14} />
                        Open
                      </Link>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setMode({ kind: "edit", project: p })}>
                      <IconEdit size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-expanded={open === p.id}
                      onClick={() => setOpen(open === p.id ? null : p.id)}
                    >
                      <IconUser size={14} />
                      Members ({p.memberCount})
                      <IconChevronDown size={12} className={cn("transition-transform", open === p.id && "rotate-180")} />
                    </Button>
                    {p.isActive ? (
                      <Link href="/admin/danger" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-destructive")}>
                        <IconArchive size={14} />
                        Archive
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => restore(p)}>
                        <IconRefresh size={14} />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
                {open === p.id && <MembersPanel project={p} onChange={refresh} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {mode && (
        <ProjectDialog
          key={mode.kind === "create" ? "create" : mode.project.id}
          mode={mode}
          onClose={() => setMode(null)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
