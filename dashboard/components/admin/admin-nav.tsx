"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

import {
  IconArrowLeft,
  IconFolder,
  IconHome,
  IconRefresh,
  IconRepo,
  IconShieldCheck,
  IconUser,
  IconWarning,
} from "@/components/icons"

const ITEMS = [
  { href: "/admin", label: "Overview", icon: IconHome },
  { href: "/admin/connection", label: "Connection", icon: IconRepo },
  { href: "/admin/projects", label: "Projects", icon: IconFolder },
  { href: "/admin/users", label: "Users", icon: IconUser },
  { href: "/admin/sync", label: "Sync runs", icon: IconRefresh },
  { href: "/admin/access", label: "Access log", icon: IconShieldCheck },
  { href: "/admin/danger", label: "Danger zone", icon: IconWarning, danger: true },
]

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`)
}

// Sidebar from lg up, a scrolling tab row below it. Every admin page links to
// every other one, so nobody has to go back through the overview.
export function AdminNav() {
  const pathname = usePathname()
  const tabs = useRef<HTMLElement>(null)
  // On phones the current tab can sit off-screen in the scrolling row.
  useEffect(() => {
    tabs.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [pathname])
  return (
    <>
      <nav
        aria-label="Admin"
        className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 flex-col gap-0.5 self-start border-e border-border bg-sidebar px-3 py-4 lg:flex"
      >
        {ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <Link
          href="/"
          className="mt-auto flex items-center gap-2 px-3 py-2 font-mono text-[13px] text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft size={14} />
          Back to docs
        </Link>
      </nav>

      <nav ref={tabs} aria-label="Admin" className="sticky top-14 z-20 flex [scrollbar-width:none] overflow-x-auto border-b border-border bg-background px-2 lg:hidden">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 font-mono text-[13px] whitespace-nowrap",
                active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon size={14} className={cn(item.danger && "text-destructive")} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

function NavLink({ item, active }: { item: (typeof ITEMS)[number]; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 border-s-2 px-3 py-2 font-mono text-[13px]",
        item.danger && "mt-3",
        active
          ? "border-primary bg-sidebar-accent font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <item.icon size={15} className={cn("shrink-0", item.danger && "text-destructive")} />
      {item.label}
    </Link>
  )
}
