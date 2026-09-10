"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { IconClose, IconMenu } from "@/components/icons"

// Below md the sidebar lives in a drawer. Keying the inner component on the
// path resets it closed after every navigation, with no effect needed.
export function MobileNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <Drawer key={pathname}>{children}</Drawer>
}

function Drawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden print:hidden">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Open pages"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="text-muted-foreground"
      >
        <IconMenu size={18} />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Pages">
          <div className="relative flex w-72 max-w-[85vw] flex-col border-e border-border bg-sidebar">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close pages"
              onClick={() => setOpen(false)}
              className="absolute end-2 top-3 text-muted-foreground"
            >
              <IconClose size={16} />
            </Button>
            {children}
          </div>
          <button
            type="button"
            aria-label="Close pages"
            className="flex-1 cursor-default bg-black/50"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
