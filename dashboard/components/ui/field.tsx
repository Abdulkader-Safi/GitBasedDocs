import { cn } from "cn"

import { IconWarning } from "@/components/icons"

// Uppercase mono micro label over the control, per the design spec.
export function FieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase",
        className
      )}
    >
      {children}
    </label>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label?: string
  htmlFor?: string
  hint?: string
  error?: string | null
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>}
      {children}
      {hint && !error && (
        <p className="font-mono text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  )
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-destructive">
      <IconWarning size={14} className="shrink-0" />
      {children}
    </p>
  )
}
