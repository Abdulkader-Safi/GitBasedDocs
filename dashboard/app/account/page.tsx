import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth/session"
import { TopBar } from "@/components/chrome/top-bar"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileForm } from "./profile-form"
import { PasswordForm } from "./password/password-form"

export const metadata: Metadata = { title: "Account" }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user.active) redirect("/login")
  // Someone still on an admin-set password picks their own first.
  if (session.user.mustChangePassword) redirect("/account/password")

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar name={session.user.name || session.user.email} isAdmin={session.user.role === "admin"} />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <PageHeader title="Account" description="Your name, the email you sign in with, and your password" />
          <ProfileForm name={session.user.name ?? ""} email={session.user.email ?? ""} />
          <PasswordForm forced={false} />
        </div>
      </main>
    </div>
  )
}
