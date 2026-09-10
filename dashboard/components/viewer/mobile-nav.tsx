"use client"

import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { IconClose, IconMenu } from "@/components/icons"

// Below md the sidebar lives in a drawer. A native modal <dialog> gives
// Escape to close, a focus trap, an inert page behind it, and focus back on
// the menu button when it closes. Picking a page or tapping the backdrop
// closes it too.
export function MobileNav({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <div className="md:hidden print:hidden">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Open pages"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className="text-muted-foreground"
      >
        <IconMenu size={18} />
      </Button>

      <dialog
        ref={dialog}
        aria-label="Pages"
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (target === dialog.current || target.closest("a")) dialog.current?.close()
        }}
        className="fixed inset-y-0 start-0 m-0 h-svh max-h-none w-72 max-w-[85vw] border-e border-border bg-sidebar p-0 text-foreground backdrop:bg-black/50"
      >
        <div className="relative flex h-full flex-col">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close pages"
            onClick={() => dialog.current?.close()}
            className="absolute end-2 top-3 text-muted-foreground"
          >
            <IconClose size={16} />
          </Button>
          {children}
        </div>
      </dialog>
    </div>
  )
}
