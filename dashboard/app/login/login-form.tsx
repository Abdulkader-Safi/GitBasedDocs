"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { ErrorText, Field } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { IconArrowRight } from "@/components/icons"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await signIn("credentials", {
      email,
      password,
      remember: String(remember),
      redirect: false,
    })
    setBusy(false)
    if (res?.error) {
      setError("Email or password is wrong.")
      return
    }
    router.push(params.get("callbackUrl") ?? "/")
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm border border-border bg-card px-6 py-6">
      <h1 className="font-heading text-lg font-medium text-foreground">Sign in</h1>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Checkbox
          id="remember"
          checked={remember}
          onCheckedChange={setRemember}
          label="Keep me logged in"
        />

        {error && <ErrorText>{error}</ErrorText>}

        <Button type="submit" disabled={busy} className="w-full">
          <IconArrowRight size={16} />
          {busy ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center font-mono text-xs text-muted-foreground">
          No account yet? Contact your admin.
        </p>
      </form>
    </div>
  )
}
