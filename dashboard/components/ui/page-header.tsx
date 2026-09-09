import { cn } from "cn"

// Serif page title with a mono sub line, used on every reader and admin page.
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="ms-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center gap-1 border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
      {children}
    </kbd>
  )
}
