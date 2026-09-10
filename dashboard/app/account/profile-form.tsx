"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { ErrorText, Field } from "@/components/ui/field"
import { IconCheck, IconUser } from "@/components/icons"

export function ProfileForm({ name: initialName, email: initialEmail }: { name: string; email: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [savedEmail, setSavedEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  // The email is how this person signs in, so a new one asks for the
  // password. The field only appears once the email actually changes.
  const emailChanged = email.trim().toLowerCase() !== savedEmail

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setDone(false)
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, currentPassword: emailChanged ? password : undefined }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "Save failed")
      return
    }
    setSavedEmail(email.trim().toLowerCase())
    setPassword("")
    setDone(true)
    // The top bar shows the name; refresh the server parts so it updates.
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4 border border-border bg-card px-6 py-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-medium">
        <IconUser size={18} />
        Profile
      </h2>

      <Field label="Name" htmlFor="profile-name" hint="Shown in the top bar and in the admin Users list.">
        <Input id="profile-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </Field>
      <Field label="Email" htmlFor="profile-email" hint="You sign in with this.">
        <Input id="profile-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {emailChanged && (
        <Field label="Current password" htmlFor="profile-password" hint="Needed to change the email you sign in with.">
          <PasswordInput id="profile-password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
      )}

      {error && <ErrorText>{error}</ErrorText>}
      {done && (
        <p className="flex items-center gap-1.5 font-mono text-xs text-status-success">
          <IconCheck size={13} />
          Saved.
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        <IconCheck size={16} />
        {busy ? "Saving..." : "Save profile"}
      </Button>
    </form>
  )
}
