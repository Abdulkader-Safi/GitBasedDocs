import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/session"
import { TopBar } from "@/components/chrome/top-bar"
import { PasswordForm } from "./password-form"

export const metadata: Metadata = { title: "Change password" }

export default async function PasswordPage() {
  // auth(), not requireSession(): this is where requireSession sends people.
  const session = await auth()
  if (!session) redirect("/login")
  const forced = session.user.mustChangePassword
  // Only the forced first-login change lives here; otherwise it is part of
  // the account page.
  if (!forced) redirect("/account")

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar name={session.user.name || session.user.email} isAdmin={session.user.role === "admin" && !forced} />
      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <PasswordForm forced={forced} />
      </main>
    </div>
  )
}
