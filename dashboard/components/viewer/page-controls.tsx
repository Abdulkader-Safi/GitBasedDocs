"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { cn } from "cn"

import { PREF_KEYS } from "@/lib/viewer/prefs"
import { IconCheck, IconPanel, IconWidthFull, IconWidthNarrow, IconWidthWide } from "@/components/icons"

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

const WIDTHS: { value: PageWidth; label: string; hint: string; icon: typeof IconWidthNarrow }[] = [
  { value: "narrow", label: "Narrow", hint: "Easiest to read", icon: IconWidthNarrow },
  { value: "wide", label: "Wide", hint: "Room for tables and diagrams", icon: IconWidthWide },
  { value: "full", label: "Full width", hint: "Use the whole window", icon: IconWidthFull },
]

const iconButton =
  "flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground pointer-coarse:size-10"

export function PageWidthMenu() {
  const [width, setWidth] = usePref<PageWidth>("pageWidth", "narrow")
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const current = WIDTHS.find((w) => w.value === width) ?? WIDTHS[0]

  // Close on a click elsewhere or Escape, and give focus back to the button.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative hidden lg:block">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Page width: ${current.label}`}
        title="Page width"
        onClick={() => setOpen((o) => !o)}
        className={iconButton}
      >
        <current.icon size={16} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Page width"
          className="absolute end-0 top-full z-40 mt-1 flex w-60 flex-col border border-border bg-popover py-1 shadow-lg"
        >
          {WIDTHS.map((w) => (
            <button
              key={w.value}
              type="button"
              role="menuitemradio"
              aria-checked={w.value === width}
              onClick={() => {
                setWidth(w.value)
                setOpen(false)
                button.current?.focus()
              }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-start hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                w.value === width ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <w.icon size={16} className="shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-mono text-[13px] font-medium">{w.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{w.hint}</span>
              </span>
              {w.value === width && <IconCheck size={14} className="shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
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
