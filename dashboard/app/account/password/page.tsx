import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/session"
import { TopBar } from "@/components/chrome/top-bar"
import { PasswordForm } from "./password-form"

export default async function PasswordPage() {
  // auth(), not requireSession(): this is where requireSession sends people.
  const session = await auth()
  if (!session) redirect("/login")
  const forced = session.user.mustChangePassword

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar email={session.user.email} isAdmin={session.user.role === "admin" && !forced} />
      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <PasswordForm forced={forced} />
      </main>
    </div>
  )
}
