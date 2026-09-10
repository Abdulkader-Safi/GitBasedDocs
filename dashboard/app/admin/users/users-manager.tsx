"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorText, Field } from "@/components/ui/field"
import { PageHeader } from "@/components/ui/page-header"
import { Chip } from "@/components/ui/status-badge"
import { relativeTime } from "@/lib/format"
import {
  IconArchive,
  IconCheck,
  IconClock,
  IconClose,
  IconEdit,
  IconLock,
  IconLogout,
  IconMore,
  IconPlus,
  IconRefresh,
  IconSettings,
  IconUser,
} from "@/components/icons"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  projectIds: string[]
}

interface ProjectChoice {
  id: string
  name: string
  isActive: number
}

type Mode = { kind: "create" } | { kind: "edit"; user: User } | { kind: "reset"; user: User }

const selectClass =
  "h-9 w-full border border-input bg-background px-3 font-mono text-[13px] text-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"


function UserDialog({
  mode,
  projects,
  onClose,
  onSaved,
}: {
  mode: Mode
  projects: ProjectChoice[]
  onClose: () => void
  onSaved: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const editing = mode.kind === "edit" ? mode.user : null
  const [name, setName] = useState(editing?.name ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(editing?.role ?? "viewer")
  const [picked, setPicked] = useState<string[]>(editing?.projectIds ?? [])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // showModal focuses the close button; start on the first field instead.
  useEffect(() => {
    ref.current?.showModal()
    ref.current?.querySelector("input")?.focus()
  }, [])

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const [url, method, body] =
      mode.kind === "create"
        ? ["/api/admin/users", "POST", { name, email, password, role, projectIds: picked }]
        : mode.kind === "edit"
          ? [`/api/admin/users/${mode.user.id}`, "PATCH", { name, email, role, projectIds: picked }]
          : [`/api/admin/users/${mode.user.id}/password`, "POST", { password }]
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "Save failed")
      return
    }
    onSaved()
    onClose()
  }

  const title =
    mode.kind === "create" ? "New user" : mode.kind === "edit" ? `Edit ${mode.user.email}` : `Reset password for ${mode.user.email}`

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="fixed inset-x-0 mx-auto mt-[10vh] mb-auto w-[calc(100%-2rem)] max-w-[480px] border border-border bg-popover p-0 text-foreground shadow-2xl backdrop:bg-black/50"
    >
      <form onSubmit={save} className="flex flex-col gap-4 px-6 py-5">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 truncate font-heading text-base font-medium">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => ref.current?.close()}
            className="ms-auto text-muted-foreground hover:text-foreground"
          >
            <IconClose size={16} />
          </button>
        </div>

        {mode.kind !== "reset" && (
          <Field label="Name" htmlFor="u-name">
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dana Wu" />
          </Field>
        )}
        {mode.kind !== "reset" && (
          <Field label="Email" htmlFor="u-email" hint={mode.kind === "edit" ? "They sign in with this. Tell them if you change it." : undefined}>
            <Input id="u-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dana@acme.io" />
          </Field>
        )}
        {mode.kind !== "edit" && (
          <Field
            label={mode.kind === "reset" ? "Temporary password" : "Password"}
            htmlFor="u-password"
            hint="At least 10 characters. They set their own on first login. Share it with them yourself."
          >
            <Input id="u-password" type="text" autoComplete="off" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        )}
        {mode.kind === "reset" && (
          <p className="font-mono text-xs text-muted-foreground">
            Their current sessions end on their next request.
          </p>
        )}

        {mode.kind !== "reset" && (
          <Field label="Role" htmlFor="u-role">
            <select id="u-role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
              <option value="viewer">Viewer: reads the projects they are given</option>
              <option value="editor">Editor: reads their projects, can preview drafts</option>
              <option value="admin">Admin: everything, every project</option>
            </select>
          </Field>
        )}

        {mode.kind !== "reset" && role !== "admin" && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Projects
            </legend>
            {projects.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">No projects yet.</p>
            ) : (
              <div className="flex max-h-48 flex-col overflow-y-auto border border-border">
                {projects.map((p, i) => (
                  <label
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 px-3 py-2 font-mono text-[13px] hover:bg-accent",
                      i > 0 && "border-t border-border",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={picked.includes(p.id)}
                      onChange={() => toggle(p.id)}
                      className="size-4 accent-primary"
                    />
                    {p.name}
                    {!p.isActive && <span className="text-muted-foreground">(archived)</span>}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        )}
        {mode.kind !== "reset" && role === "admin" && (
          <p className="font-mono text-xs text-muted-foreground">Admins see every project, so there is nothing to pick.</p>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            <IconCheck size={16} />
            {busy ? "Saving..." : mode.kind === "create" ? "Create user" : mode.kind === "edit" ? "Save" : "Reset password"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>
            Cancel
          </Button>
        </div>
      </form>
    </dialog>
  )
}

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<ProjectChoice[]>([])
  const [loaded, setLoaded] = useState(false)
  const [mode, setMode] = useState<Mode | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const data = await fetch("/api/admin/users").then((r) => r.json())
    setUsers(data.users ?? [])
    setProjects(data.projects ?? [])
    setLoaded(true)
  }

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? [])
        setProjects(data.projects ?? [])
        setLoaded(true)
      })
  }, [])

  async function act(label: string, run: () => Promise<Response>) {
    setError(null)
    setNotice(null)
    const res = await run()
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? `${label} failed`)
      return
    }
    setNotice(label)
    refresh()
  }

  const setActive = (u: User, isActive: boolean) =>
    act(isActive ? `Reactivated ${u.email}` : `Deactivated ${u.email}`, () =>
      fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }),
    )
  const revoke = (u: User) =>
    act(`Signed ${u.email} out everywhere`, () => fetch(`/api/admin/users/${u.id}/revoke`, { method: "POST" }))

  const menu = (u: User) => {
    const self = u.id === currentUserId
    return (
      <details className="group relative inline-block shrink-0">
        <summary
          aria-label={`Actions for ${u.email}`}
          className="flex size-8 cursor-pointer list-none pointer-coarse:size-10 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden"
        >
          <IconMore size={16} />
        </summary>
        <div className="absolute end-0 top-full z-30 mt-1 flex w-60 flex-col border border-border bg-popover py-1 text-start whitespace-nowrap shadow-lg">
          <MenuItem icon={<IconEdit size={14} />} onClick={() => setMode({ kind: "edit", user: u })}>
            Edit role and projects
          </MenuItem>
          <MenuItem icon={<IconLock size={14} />} onClick={() => setMode({ kind: "reset", user: u })}>
            Reset password
          </MenuItem>
          {!self && (
            <MenuItem icon={<IconLogout size={14} />} onClick={() => revoke(u)}>
              Sign out everywhere
            </MenuItem>
          )}
          {!self &&
            (u.isActive ? (
              <MenuItem icon={<IconArchive size={14} />} danger onClick={() => setActive(u, false)}>
                Deactivate
              </MenuItem>
            ) : (
              <MenuItem icon={<IconRefresh size={14} />} onClick={() => setActive(u, true)}>
                Reactivate
              </MenuItem>
            ))}
        </div>
      </details>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Users"
        description="Accounts and per project access"
        actions={
          <Button onClick={() => setMode({ kind: "create" })}>
            <IconPlus size={16} />
            New user
          </Button>
        }
      />

      {notice && (
        <p className="flex items-center gap-1.5 font-mono text-xs text-status-success">
          <IconCheck size={13} />
          {notice}
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}

      {/* Table from lg up, where it fits without a scroll box (a scroll box
          would also clip the actions menu). Stacked rows below that. */}
      <div className="hidden border border-border bg-card lg:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              {["Name", "Email", "Role", "Status", "Projects", "Last login", ""].map((h) => (
                <th key={h} className="px-3.5 py-2.5 text-start font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loaded ? (
              <tr><td colSpan={7} className="px-3.5 py-5 font-mono text-xs text-muted-foreground">Loading...</td></tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  // Dim a deactivated person's details, not the actions cell: an
                  // opacity on the row would make its dropdown see-through too.
                  className={cn("border-t border-border", !u.isActive && "[&>td:not(:last-child)]:opacity-50")}
                >
                  <td className="px-3.5 py-3 font-mono text-[13px] font-medium">
                    <UserName user={u} self={u.id === currentUserId} />
                  </td>
                  <td className="px-3.5 py-3 font-mono text-[13px] text-muted-foreground">{u.email}</td>
                  <td className="px-3.5 py-3"><RolePill user={u} /></td>
                  <td className="px-3.5 py-3"><StatusPill user={u} /></td>
                  <td className="px-3.5 py-3 font-mono text-[13px] text-muted-foreground">
                    {u.role === "admin" ? "all" : u.projectIds.length}
                  </td>
                  <td className="px-3.5 py-3 font-mono text-xs text-muted-foreground"><LastLogin user={u} /></td>
                  <td className="px-2 py-2 text-end">{menu(u)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col border border-border bg-card lg:hidden">
        {!loaded ? (
          <li className="px-4 py-5 font-mono text-xs text-muted-foreground">Loading...</li>
        ) : (
          users.map((u) => (
            <li key={u.id} className="flex items-start gap-3 border-t border-border px-4 py-3.5 first:border-t-0">
              <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", !u.isActive && "opacity-50")}>
                <span className="font-mono text-[13px] font-medium"><UserName user={u} self={u.id === currentUserId} /></span>
                <span className="truncate font-mono text-xs text-muted-foreground">{u.email}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <RolePill user={u} />
                  <StatusPill user={u} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {u.role === "admin" ? "all projects" : `${u.projectIds.length} ${u.projectIds.length === 1 ? "project" : "projects"}`}
                  </span>
                </span>
                <span className="font-mono text-xs text-muted-foreground"><LastLogin user={u} /></span>
              </div>
              {menu(u)}
            </li>
          ))
        )}
      </ul>

      {mode && (
        <UserDialog
          key={mode.kind === "create" ? "create" : `${mode.kind}:${mode.user.id}`}
          mode={mode}
          projects={projects}
          onClose={() => setMode(null)}
          onSaved={() => {
            setNotice(mode.kind === "create" ? "User created" : mode.kind === "edit" ? "Saved" : "Password reset")
            refresh()
          }}
        />
      )}
    </div>
  )
}

function UserName({ user, self }: { user: User; self: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <IconUser size={14} className="shrink-0 text-muted-foreground" />
      <span>
        {user.name ?? "Unnamed"}
        {self && <span className="ms-1.5 text-muted-foreground">(you)</span>}
      </span>
    </span>
  )
}

function RolePill({ user }: { user: User }) {
  return (
    <Chip tone={user.role === "admin" ? "strong" : "neutral"}>
      {user.role === "admin" && <IconSettings size={11} />}
      {user.role}
    </Chip>
  )
}

function StatusPill({ user }: { user: User }) {
  return (
    <Chip tone={user.isActive ? "success" : "neutral"}>
      {user.isActive ? <IconCheck size={11} /> : <IconArchive size={11} />}
      {user.isActive ? "Active" : "Deactivated"}
    </Chip>
  )
}

function LastLogin({ user }: { user: User }) {
  return (
    <span className="flex items-center gap-1.5">
      <IconClock size={12} className="shrink-0" />
      {user.lastLoginAt ? `Signed in ${relativeTime(new Date(user.lastLoginAt))}` : "Never signed in"}
    </span>
  )
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.currentTarget.closest("details")?.removeAttribute("open")
        onClick()
      }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-start font-mono text-[13px] hover:bg-accent",
        danger ? "text-destructive" : "text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  )
}
