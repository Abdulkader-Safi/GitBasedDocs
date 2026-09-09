"use client"

import { useState } from "react"
import { cn } from "cn"

import { IconCheck, IconCopy } from "@/components/icons"

// Dark fill in both themes, language label top left, copy button top right.
export function CodeBlock({
  language,
  code,
  className,
  children,
}: {
  language?: string
  code: string
  className?: string
  children?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked (insecure origin, denied permission). Leave the
      // label alone rather than claiming a copy that did not happen.
    }
  }

  return (
    <div className={cn("bg-code-surface text-code-foreground", className)}>
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-code-muted uppercase">
          {language ?? "text"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex cursor-pointer items-center gap-1.5 px-2 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-code-muted uppercase transition-colors hover:text-code-foreground"
        >
          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 pt-1 pb-4 font-mono text-[13px] leading-[1.7]">
        {children ?? <code>{code}</code>}
      </pre>
    </div>
  )
}
