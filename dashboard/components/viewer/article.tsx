"use client"

import { useEffect, useRef } from "react"

// `html` must come from renderMarkdown/renderCached, never from anywhere
// else: that pipeline drops raw HTML and runs rehype-sanitize before any of
// our own transforms (see lib/render/markdown.check.ts for the injection
// cases). Copy buttons in it are plain markup; one delegated listener wires
// them up.
export function Article({ html, highlight = "" }: { html: string; highlight?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  // Arriving from a search result: mark every occurrence of the words and
  // scroll to the first. Works on the rendered DOM, never on the HTML string.
  useEffect(() => {
    const root = ref.current
    if (!root) return
    for (const mark of root.querySelectorAll("mark.search-hit")) {
      mark.replaceWith(document.createTextNode(mark.textContent ?? ""))
    }
    root.normalize()
    const terms = highlight.toLowerCase().split(/\s+/).filter((t) => t.length > 1)
    if (!terms.length) return
    const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.parentElement?.closest("button, .heading-anchor") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    })
    const nodes: Text[] = []
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text)
    for (const node of nodes) {
      const parts = node.data.split(pattern)
      if (parts.length < 2) continue
      const frag = document.createDocumentFragment()
      parts.forEach((part, i) => {
        if (i % 2 === 1) {
          const mark = document.createElement("mark")
          mark.className = "search-hit"
          mark.textContent = part
          frag.append(mark)
        } else if (part) frag.append(part)
      })
      node.replaceWith(frag)
    }
    root.querySelector("mark.search-hit")?.scrollIntoView({ block: "center" })
  }, [html, highlight])

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
