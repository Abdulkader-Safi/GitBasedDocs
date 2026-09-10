"use client"

import { useSyncExternalStore } from "react"
import { cn } from "cn"

import { PREF_KEYS } from "@/lib/viewer/prefs"
import { IconPanel, IconWidthFull, IconWidthNarrow, IconWidthWide } from "@/components/icons"

type PrefName = keyof typeof PREF_KEYS

// One tiny store for both preferences: the value is the <html> data
// attribute, a change writes it plus localStorage and tells subscribers.
function subscribe(onChange: () => void) {
  window.addEventListener("gbd:prefs", onChange)
  return () => window.removeEventListener("gbd:prefs", onChange)
}

function usePref<T extends string>(name: PrefName, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset[name] as T | undefined) ?? fallback,
    () => fallback,
  )
  const set = (next: T) => {
    document.documentElement.dataset[name] = next
    try {
      localStorage.setItem(PREF_KEYS[name], next)
    } catch {
      // Private mode or blocked storage: the choice still holds for this page.
    }
    window.dispatchEvent(new Event("gbd:prefs"))
  }
  return [value, set]
}

type PageWidth = "narrow" | "wide" | "full"

const WIDTHS: { value: PageWidth; label: string; icon: typeof IconWidthNarrow }[] = [
  { value: "narrow", label: "Narrow", icon: IconWidthNarrow },
  { value: "wide", label: "Wide", icon: IconWidthWide },
  { value: "full", label: "Full width", icon: IconWidthFull },
]

const iconButton =
  "flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground pointer-coarse:size-10"

// One button that steps through Narrow, Wide and Full width. The icon shows
// the current width; the label says what the next click does.
export function PageWidthToggle() {
  const [width, setWidth] = usePref<PageWidth>("pageWidth", "narrow")
  const at = Math.max(0, WIDTHS.findIndex((w) => w.value === width))
  const current = WIDTHS[at]
  const next = WIDTHS[(at + 1) % WIDTHS.length]
  const label = `Page width: ${current.label}. Switch to ${next.label}.`
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setWidth(next.value)}
      className={cn(iconButton, "hidden lg:flex")}
    >
      <current.icon size={16} />
    </button>
  )
}

// Shows or hides the "On this page" panel. Used in the top bar and in the
// panel's own header, both driving the same stored preference.
export function OutlineToggle({ className }: { className?: string }) {
  const [state, setState] = usePref<"shown" | "hidden">("outline", "shown")
  const shown = state !== "hidden"
  return (
    <button
      type="button"
      aria-pressed={shown}
      aria-label={shown ? "Hide page outline" : "Show page outline"}
      title={shown ? "Hide page outline" : "Show page outline"}
      onClick={() => setState(shown ? "hidden" : "shown")}
      className={cn(iconButton, shown && "text-foreground", className)}
    >
      {/* The set's panel icon has its panel on the left; mirror it to match
          the outline's side. */}
      <IconPanel size={16} className="-scale-x-100" />
    </button>
  )
}
