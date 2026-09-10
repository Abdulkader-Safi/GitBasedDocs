"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { ErrorText, Field } from "@/components/ui/field"
import { IconCheck, IconLock } from "@/components/icons"

export function PasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const Heading = forced ? "h1" : "h2"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (next !== confirm) {
      setError("The two new passwords do not match.")
      return
    }
    setBusy(true)
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "Change failed")
      return
    }
    setDone(true)
    setCurrent("")
    setNext("")
    setConfirm("")
    if (forced) {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <form onSubmit={submit} className={cn("flex w-full flex-col gap-4 border border-border bg-card px-6 py-6", forced && "max-w-sm")}>
      <div className="flex flex-col gap-1.5">
        {/* Alone on the forced first-login page it is the page title; on the
            account page it is a section under "Account". */}
        <Heading className="flex items-center gap-2 font-heading text-lg font-medium">
          <IconLock size={18} />
          {forced ? "Set your password" : "Change password"}
        </Heading>
        {forced && (
          <p className="font-mono text-xs text-muted-foreground">
            This account is using a password someone else set. Pick your own to continue.
          </p>
        )}
      </div>

      <Field label={forced ? "Current (temporary) password" : "Current password"} htmlFor="current">
        <PasswordInput id="current" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password" htmlFor="next" hint="At least 10 characters, not a common password, not your email name.">
        <PasswordInput id="next" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field label="New password again" htmlFor="confirm">
        <PasswordInput id="confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>

      {error && <ErrorText>{error}</ErrorText>}
      {done && !forced && (
        <p className="flex items-center gap-1.5 font-mono text-xs text-status-success">
          <IconCheck size={13} />
          Password changed.
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        <IconCheck size={16} />
        {busy ? "Saving..." : "Save password"}
      </Button>
    </form>
  )
}
