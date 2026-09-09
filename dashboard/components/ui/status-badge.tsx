import { cn } from "cn"

import { IconCheck, IconRefresh, IconWarning } from "@/components/icons"

export type ConnectionStatus = "connected" | "syncing" | "error"

const STATES = {
  connected: { icon: IconCheck, label: "Connected", tone: "bg-status-success" },
  syncing: { icon: IconRefresh, label: "Syncing", tone: "bg-status-warning" },
  error: { icon: IconWarning, label: "Error", tone: "bg-destructive" },
} as const

// Sharp chip, not a pill: radius is 0 across the whole system. Text sits on
// --background so it stays readable when the status colour flips in dark.
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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 font-mono text-xs font-medium text-background",
        state.tone,
        className
      )}
    >
      <Icon size={12} />
      {label ?? state.label}
    </span>
  )
}
