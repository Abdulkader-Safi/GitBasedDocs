import { cn } from "cn"

import { IconInfo, IconTip, IconWarning } from "@/components/icons"

export type CalloutKind = "note" | "tip" | "warning"

const KINDS = {
  note: { icon: IconInfo, label: "NOTE", accent: "border-l-foreground text-foreground" },
  tip: { icon: IconTip, label: "TIP", accent: "border-l-status-success text-status-success" },
  warning: { icon: IconWarning, label: "WARNING", accent: "border-l-status-warning text-status-warning" },
} as const

// GitHub style `> [!NOTE]` blocks: 3px left rule, tinted fill, bold label.
export function Callout({
  kind = "note",
  children,
  className,
}: {
  kind?: CalloutKind
  children: React.ReactNode
  className?: string
}) {
  const meta = KINDS[kind]
  const Icon = meta.icon
  return (
    <div
      className={cn(
        "flex gap-3 border-l-[3px] bg-muted px-4 py-3.5",
        meta.accent,
        className
      )}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-[11px] font-medium tracking-[0.08em]">
          {meta.label}
        </span>
        <div className="font-sans text-[15px] leading-relaxed text-foreground">
          {children}
        </div>
      </div>
    </div>
  )
}
