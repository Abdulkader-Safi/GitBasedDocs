"use client"

import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { IconLogout } from "@/components/icons"

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Sign out"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-muted-foreground"
    >
      <IconLogout size={16} />
    </Button>
  )
}
