"use client"

import { cn } from "cn"

import { IconCheck } from "@/components/icons"

// 16px sharp square, filled with foreground when checked. The native input
// stays in the DOM so labels, focus and form semantics keep working.
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  id,
  className,
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  label: React.ReactNode
  id?: string
  className?: string
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground select-none",
        className
      )}
    >
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="peer absolute inset-0 cursor-pointer appearance-none border border-input bg-background checked:border-primary checked:bg-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
        <IconCheck
          size={11}
          className="pointer-events-none relative hidden text-primary-foreground peer-checked:block"
        />
      </span>
      {label}
    </label>
  )
}
