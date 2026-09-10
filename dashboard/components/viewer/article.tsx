"use client"

import { useEffect, useRef } from "react"

// `html` must come from renderMarkdown/renderCached, never from anywhere
// else: that pipeline drops raw HTML and runs rehype-sanitize before any of
// our own transforms (see lib/render/markdown.check.ts for the injection
// cases). Copy buttons in it are plain markup; one delegated listener wires
// them up.
export function Article({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const timers = new Set<ReturnType<typeof setTimeout>>()

    async function onClick(e: MouseEvent) {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-copy]")
      if (!button || !root?.contains(button)) return
      const code = button.closest(".code-block")?.querySelector("pre")?.textContent ?? ""
      try {
        await navigator.clipboard.writeText(code)
        button.textContent = "Copied"
        const t = setTimeout(() => {
          button.textContent = "Copy"
          timers.delete(t)
        }, 1500)
        timers.add(t)
      } catch {
        // Clipboard blocked (insecure origin, denied permission). Leave the
        // label alone rather than claiming a copy that did not happen.
      }
    }

    root.addEventListener("click", onClick)
    return () => {
      root.removeEventListener("click", onClick)
      for (const t of timers) clearTimeout(t)
    }
  }, [])

  return <div ref={ref} className="doc-prose" dangerouslySetInnerHTML={{ __html: html }} />
}
