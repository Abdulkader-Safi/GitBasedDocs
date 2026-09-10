"use client"

import { useEffect, useState } from "react"
import { cn } from "cn"

import type { OutlineItem } from "@/lib/render/markdown"

// "On this page": the page's h2 and h3, with the one being read marked.
// A heading counts as current once it passes the top third of the screen.
export function Outline({ items }: { items: OutlineItem[] }) {
  const [current, setCurrent] = useState(items[0]?.id ?? "")

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (!headings.length) return
    const onScroll = () => {
      const line = window.innerHeight / 3
      let id = headings[0].id
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= line) id = h.id
        else break
      }
      setCurrent(id)
    }
    // First read after layout, for pages opened at a #heading.
    const frame = requestAnimationFrame(onScroll)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
    }
  }, [items])

  return (
    <nav aria-label="On this page" className="flex flex-col gap-2.5">
      <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        On this page
      </span>
      <ul className="flex flex-col border-s border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === current ? "location" : undefined}
              className={cn(
                "-ms-px block border-s-2 py-1 font-mono text-[13px] leading-snug",
                item.depth === 3 ? "ps-6" : "ps-3",
                item.id === current
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
