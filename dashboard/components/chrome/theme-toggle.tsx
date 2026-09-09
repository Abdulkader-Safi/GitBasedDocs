"use client"

import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { IconMoon, IconSun } from "@/components/icons"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  // next-themes puts .dark on <html>, so CSS picks the icon. No mount flag,
  // no hydration mismatch, no effect.
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-muted-foreground"
    >
      <IconSun size={16} className="dark:hidden" />
      <IconMoon size={16} className="hidden dark:block" />
    </Button>
  )
}
