import { cn } from "cn"

import { IconCheck, IconRefresh, IconWarning } from "@/components/icons"

const TONES = {
  success: "border-status-success text-status-success",
  warning: "border-status-warning text-status-warning",
  danger: "border-destructive text-destructive",
  neutral: "border-border text-muted-foreground",
  strong: "border-foreground text-foreground",
} as const

export type ChipTone = keyof typeof TONES

// The one status chip: sharp, outlined, mono caps. Every badge in the app
// (connection, sync runs, roles, access results) goes through this.
export function Chip({
  tone,
  children,
  className,
}: {
  tone: ChipTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

export type ConnectionStatus = "connected" | "syncing" | "error"

const STATES = {
  connected: { icon: IconCheck, label: "Connected", tone: "success" },
  syncing: { icon: IconRefresh, label: "Syncing", tone: "warning" },
  error: { icon: IconWarning, label: "Error", tone: "danger" },
} as const

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: ConnectionStatus
  label?: string
  className?: string
}) {
  const state = STATES[status]
  const Icon = state.icon
  return (
    <Chip tone={state.tone} className={className}>
      <Icon size={11} />
      {label ?? state.label}
    </Chip>
  )
}
