import Link from "next/link"

import { IconBook, IconSettings, IconUser } from "@/components/icons"
import { SignOutButton } from "@/components/chrome/sign-out-button"
import { ThemeToggle } from "@/components/chrome/theme-toggle"

// 56px bar with a bottom rule, on every page except login.
export function TopBar({
  variant = "reader",
  email,
  children,
}: {
  variant?: "reader" | "admin"
  email?: string | null
  children?: React.ReactNode
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-6">
      <Link
        href={variant === "admin" ? "/admin" : "/"}
        className="flex items-center gap-2 font-mono text-sm font-medium text-foreground"
      >
        <IconBook size={18} />
        GitBasedDocs
      </Link>

      {variant === "admin" && (
        <span className="flex items-center gap-1.5 bg-muted px-2 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          <IconSettings size={11} />
          Admin
        </span>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {children}
        <ThemeToggle />
        {email && (
          <span className="hidden items-center gap-1.5 font-mono text-[13px] text-muted-foreground md:flex">
            <IconUser size={14} />
            {email}
          </span>
        )}
        <SignOutButton />
      </div>
    </header>
  )
}
