"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "cn"

import { pageHref } from "@/lib/render/markdown"
import {
  IconArrowDown,
  IconArrowRight,
  IconClose,
  IconCommand,
  IconFile,
  IconRepo,
  IconSearch,
} from "@/components/icons"

interface Hit {
  slug: string
  title: string
  trail: string
  snippet: string
}

// Put the typed words in medium weight inside a result line.
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length || !text) return <>{text}</>
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-medium text-foreground">{part}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

// Cmd+K palette scoped to one project. A native <dialog> gives focus
// trapping, Escape to close and a backdrop for free.
export function SearchPalette({ projectSlug, projectName }: { projectSlug: string; projectName: string }) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [recent, setRecent] = useState(true)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)

  function open() {
    dialog.current?.showModal()
    input.current?.select()
    search(query)
  }

  function close() {
    dialog.current?.close()
  }

  // Latest request wins, so a slow answer for "au" cannot overwrite "auth".
  const seq = useRef(0)
  async function search(q: string) {
    const mine = ++seq.current
    setLoading(true)
    try {
      const res = await fetch(`/api/p/${encodeURIComponent(projectSlug)}/search?q=${encodeURIComponent(q)}`)
      if (!res.ok || mine !== seq.current) return
      const data = (await res.json()) as { hits: Hit[]; recent: boolean }
      setHits(data.hits)
      setRecent(data.recent)
      setActive(0)
    } finally {
      if (mine === seq.current) setLoading(false)
    }
  }

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onType(value: string) {
    setQuery(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => search(value), 150)
  }

  function go(hit: Hit) {
    close()
    const q = query.trim()
    router.push(`${pageHref(projectSlug, hit.slug)}${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  }

  // Cmd+K / Ctrl+K anywhere on the page, and "/" when not typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName))
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault()
        if (dialog.current?.open) close()
        else open()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, hits.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault()
      go(hits[active])
    }
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Search this project"
        className="flex h-8 items-center gap-2 border border-border bg-muted px-2.5 font-mono text-[13px] text-muted-foreground hover:text-foreground sm:w-64"
      >
        <IconSearch size={14} />
        <span className="hidden flex-1 text-start sm:inline">Search</span>
        <kbd className="hidden items-center gap-0.5 border border-border bg-background px-1.5 py-0.5 text-[11px] sm:flex">
          <IconCommand size={10} />K
        </kbd>
      </button>

      <dialog
        ref={dialog}
        aria-label={`Search ${projectName}`}
        onClick={(e) => e.target === dialog.current && close()}
        className="fixed inset-x-0 mx-auto mt-[12vh] mb-auto w-[calc(100%-2rem)] max-w-[560px] border border-border bg-popover p-0 text-foreground shadow-2xl backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between bg-muted px-4 py-2.5">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            <IconRepo size={12} />
            {projectName}
          </span>
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            This project only
          </span>
        </div>

        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <IconSearch size={16} className="shrink-0 text-muted-foreground" />
          <input
            ref={input}
            value={query}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={onListKey}
            placeholder="Search pages"
            aria-label="Search pages"
            aria-controls="search-results"
            aria-activedescendant={hits[active] ? `hit-${active}` : undefined}
            className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="border border-border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase hover:text-foreground"
          >
            Esc
          </button>
        </div>

        <ul id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto py-1.5">
          {recent && hits.length > 0 && (
            <li className="px-4 pt-1 pb-1.5 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Recent pages
            </li>
          )}
          {hits.length === 0 && !loading && (
            <li className="px-4 py-6 text-center font-mono text-[13px] text-muted-foreground">
              {query.trim() ? "No results in this project." : "No pages yet."}
            </li>
          )}
          {hits.map((hit, i) => (
            <li
              key={hit.slug}
              id={`hit-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(hit)}
              className={cn(
                "flex cursor-pointer items-start gap-3 px-4 py-2.5",
                i === active && "bg-accent",
              )}
            >
              <IconFile size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate font-mono text-sm font-medium">
                    <Highlight text={hit.title} terms={terms} />
                  </span>
                  {hit.trail && (
                    <span className="truncate font-mono text-xs text-muted-foreground">{hit.trail}</span>
                  )}
                </span>
                {hit.snippet && (
                  <span className="line-clamp-1 font-mono text-[13px] text-muted-foreground">
                    <Highlight text={hit.snippet} terms={terms} />
                  </span>
                )}
              </span>
              {i === active && <IconArrowRight size={14} className="mt-0.5 shrink-0" />}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 border-t border-border bg-muted px-4 py-2 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          <span className="flex items-center gap-1"><IconArrowRight size={11} />open</span>
          <span className="flex items-center gap-1"><IconArrowDown size={11} />move</span>
          <span className="flex items-center gap-1"><IconClose size={11} />close</span>
          <span className="ms-auto">{loading ? "Searching" : `${hits.length} ${hits.length === 1 ? "result" : "results"}`}</span>
        </div>
      </dialog>
    </>
  )
}
