import Link from "next/link"

import { IconBook, IconSettings, IconUser } from "@/components/icons"
import { SignOutButton } from "@/components/chrome/sign-out-button"
import { ThemeToggle } from "@/components/chrome/theme-toggle"

// 56px bar with a bottom rule, on every page except login.
export function TopBar({
  variant = "reader",
  name,
  isAdmin = false,
  lead,
  start,
  children,
}: {
  variant?: "reader" | "admin"
  // The person's name, or their email when they have no name.
  name?: string | null
  // Admins get a way into the admin area from the reader pages.
  isAdmin?: boolean
  // Before the wordmark, e.g. the mobile menu button.
  lead?: React.ReactNode
  // After the wordmark, e.g. the project switcher.
  start?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:gap-4 sm:px-6 print:hidden">
      {lead}
      <Link
        href="/"
        aria-label="GitBasedDocs home"
        className="flex shrink-0 items-center gap-2 font-mono text-sm font-medium text-foreground"
      >
        <IconBook size={18} />
        {/* Icon only on phones, where the bar also carries the switcher and search. */}
        <span className="hidden sm:inline">GitBasedDocs</span>
      </Link>

      {start && (
        <>
          <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
          {start}
        </>
      )}

      {variant === "admin" && (
        <Link
          href="/admin"
          className="flex shrink-0 items-center gap-1.5 bg-muted px-2 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase hover:text-foreground"
        >
          <IconSettings size={11} />
          Admin
        </Link>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-3">
        {children}
        {variant === "reader" && isAdmin && (
          <Link
            href="/admin"
            aria-label="Admin"
            className="flex h-8 shrink-0 items-center gap-1.5 px-2 font-mono text-[13px] pointer-coarse:h-10 text-muted-foreground hover:text-foreground"
          >
            <IconSettings size={14} />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}
        <ThemeToggle />
        {name && (
          <Link
            href="/account"
            title="Your account"
            aria-label={`Your account: ${name}`}
            className="flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 font-mono text-[13px] text-muted-foreground hover:text-foreground pointer-coarse:h-10 pointer-coarse:min-w-10"
          >
            <IconUser size={14} />
            {/* Icon only on phones; the name from md up. */}
            <span className="hidden max-w-48 truncate md:inline">{name}</span>
          </Link>
        )}
        <SignOutButton />
      </div>
    </header>
  )
}
