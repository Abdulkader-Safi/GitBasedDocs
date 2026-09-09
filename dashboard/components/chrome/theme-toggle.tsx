"use client"

import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { IconMoon, IconSun } from "@/components/icons"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  // next-themes puts .dark on <html>, so CSS picks the icon. No mount flag,
  // no hydration mismatch, no effect. Reading the class at click time also
  // avoids acting on a resolvedTheme that is still undefined on first paint.
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark") ? "light" : "dark"
        )
      }
      className="text-muted-foreground"
    >
      <IconSun size={16} className="dark:hidden" />
      <IconMoon size={16} className="hidden dark:block" />
    </Button>
  )
}
