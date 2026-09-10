"use client"

import { useEffect, useRef } from "react"

// Mermaid sizes a diagram to 100% of the column with a max-width, so a wide
// one shrinks until its labels are unreadable. Let it fit the column down to
// 75% of its natural size and no further; past that the box scrolls
// sideways. Pure CSS, so it follows the reader's page width choice.
function naturalSize(svg: SVGSVGElement | null) {
  if (!svg) return
  const natural = parseFloat(svg.style.maxWidth) || svg.viewBox.baseVal?.width || 0
  if (!natural) return
  svg.removeAttribute("width")
  svg.dataset.natural = String(natural)
  svg.style.width = `max(${Math.round(natural * 0.75)}px, min(100%, ${natural}px))`
  svg.style.maxWidth = "none"
}

// One shared dialog on <body> shows a diagram as large as the screen allows. Native <dialog> gives Escape, a backdrop
// and a focus trap; focus returns to the Expand button on close.
function openLarger(trigger: HTMLButtonElement) {
  const svg = trigger.closest(".mermaid-diagram")?.querySelector<SVGSVGElement>(".mermaid-scroll svg")
  if (!svg) return
  let dialog = document.querySelector<HTMLDialogElement>("dialog.mermaid-dialog")
  if (!dialog) {
    dialog = document.createElement("dialog")
    dialog.className = "mermaid-dialog"
    dialog.setAttribute("aria-label", "Diagram")
    dialog.addEventListener("click", (e) => e.target === dialog && dialog?.close())
    document.body.append(dialog)
  }
  const bar = document.createElement("div")
  bar.className = "mermaid-dialog-bar"
  const close = document.createElement("button")
  close.type = "button"
  close.className = "cursor-pointer px-2 py-1 hover:text-foreground"
  close.textContent = "Close"
  close.addEventListener("click", () => dialog?.close())
  bar.append("Diagram", close)
  const body = document.createElement("div")
  body.className = "mermaid-dialog-body"
  const copy = svg.cloneNode(true) as SVGSVGElement
  body.append(copy)
  dialog.replaceChildren(bar, body)
  dialog.addEventListener("close", () => trigger.focus(), { once: true })
  dialog.showModal()
  const natural = Number(copy.dataset.natural) || copy.viewBox.baseVal.width
  // Fill the dialog: shrink a wide diagram to fit (never below 60%), grow a
  // small one up to twice its size.
  const room = body.clientWidth - 48
  const size = natural > room ? Math.max(room, natural * 0.6) : Math.min(room, natural * 2)
  copy.style.width = `${Math.round(size)}px`
}

// `html` must come from renderMarkdown/renderCached, never from anywhere
// else: that pipeline runs raw HTML through rehype-sanitize's allowlist
// before any of our own transforms (see lib/render/markdown.check.ts for
// the injection cases). Copy buttons in it are plain markup; one delegated
// listener wires them up.
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
        n.parentElement?.closest("button, .heading-anchor, .mermaid-diagram") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
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
      const expand = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-expand]")
      if (expand && root?.contains(expand)) return openLarger(expand)
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

  // Mermaid diagrams. The library (large) loads only on pages that have one,
  // runs in strict mode (labels sanitized, no click handlers), and redraws
  // when the reader flips light and dark.
  useEffect(() => {
    const boxes = [...(ref.current?.querySelectorAll<HTMLElement>(".mermaid-diagram") ?? [])]
    if (!boxes.length) return
    for (const box of boxes) box.dataset.source ??= box.textContent ?? ""
    // Each draw gets a number; an older draw (theme flipped mid-way, or the
    // page changed) stops at its next await instead of overwriting.
    let latest = 0

    async function draw() {
      const mine = ++latest
      const { default: mermaid } = await import("mermaid")
      if (mine !== latest) return
      const dark = document.documentElement.classList.contains("dark")
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        // Our own message replaces a failed diagram; stop mermaid from also
        // appending its error graphic to <body>.
        suppressErrorRendering: true,
        theme: dark ? "dark" : "neutral",
        // The prose font, not the box's: an undrawn box is styled mono.
        fontFamily: getComputedStyle(ref.current ?? document.body).fontFamily,
      })
      for (const [i, box] of boxes.entries()) {
        try {
          const source = box.dataset.source ?? ""
          // parse throws on bad syntax without touching the DOM.
          await mermaid.parse(source)
          const { svg } = await mermaid.render(`mermaid-${i}-${Date.now()}`, source)
          if (mine !== latest) return
          const scroll = document.createElement("div")
          scroll.className = "mermaid-scroll"
          // Strict mode: mermaid runs the SVG through DOMPurify before
          // returning it, and the source was plain text in our own markup.
          scroll.innerHTML = svg
          naturalSize(scroll.querySelector("svg"))
          const expand = document.createElement("button")
          expand.type = "button"
          expand.className = "mermaid-expand"
          expand.textContent = "Expand"
          expand.setAttribute("aria-label", "Open diagram larger")
          expand.dataset.expand = ""
          box.replaceChildren(expand, scroll)
          box.dataset.state = "drawn"
        } catch (e) {
          // Show the source and why it failed, never an empty box.
          const pre = document.createElement("pre")
          pre.textContent = box.dataset.source ?? ""
          const why = document.createElement("p")
          why.className = "mermaid-error"
          why.textContent = `Diagram could not be drawn: ${e instanceof Error ? e.message.split("\n")[0] : "syntax error"}`
          box.replaceChildren(why, pre)
          box.dataset.state = "error"
        }
      }
    }

    draw()
    const theme = new MutationObserver(() => draw())
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => {
      latest = -1
      theme.disconnect()
    }
  }, [html])

  return <div ref={ref} className="doc-prose" dangerouslySetInnerHTML={{ __html: html }} />
}
