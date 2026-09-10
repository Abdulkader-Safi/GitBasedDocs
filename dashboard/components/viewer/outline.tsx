"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "cn"

import type { OutlineItem } from "@/lib/render/markdown"

// "On this page": the page's h2 and h3, with the one being read marked.
// A heading counts as current once it passes the top third of the screen.
export function Outline({ items }: { items: OutlineItem[] }) {
  const [current, setCurrent] = useState(items[0]?.id ?? "")
  // A clicked title stays marked while the smooth scroll runs, so the mark
  // does not flicker through every heading on the way.
  const heldUntil = useRef(0)

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (!headings.length) return
    const onScroll = () => {
      if (Date.now() < heldUntil.current) return
      // At the very bottom the last sections can never reach the top third;
      // mark the last one so it is reachable at all.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        setCurrent(headings[headings.length - 1].id)
        return
      }
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
    <nav aria-label="On this page">
      <ul className="flex flex-col border-s border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === current ? "location" : undefined}
              onClick={() => {
                setCurrent(item.id)
                heldUntil.current = Date.now() + 1000
              }}
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
