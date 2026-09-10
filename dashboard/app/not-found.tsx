import type { Metadata } from "next"
import Link from "next/link"

import { auth } from "@/lib/auth/session"
import { TopBar } from "@/components/chrome/top-bar"
import { buttonVariants } from "@/components/ui/button"
import { IconHome, IconSearch } from "@/components/icons"

// One 404 for every miss: a bad slug, a project you are not in, an archived
// project, a draft. It never names the project or hints that one exists.
export const metadata: Metadata = { title: "Page not found" }

export default async function NotFound() {
  const session = await auth()
  return (
    <div className="flex min-h-svh flex-col">
      {session && <TopBar name={session.user.name || session.user.email} isAdmin={session.user.role === "admin"} />}
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <span className="flex size-12 items-center justify-center bg-muted text-muted-foreground">
          <IconSearch size={22} />
        </span>
        <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
        <p className="font-sans text-[15px] text-muted-foreground">
          This page does not exist or was moved.
        </p>
        <Link href={session ? "/" : "/login"} className={buttonVariants()}>
          <IconHome size={16} />
          {session ? "All projects" : "Sign in"}
        </Link>
      </main>
    </div>
  )
}
