import Link from "next/link"
import { cn } from "cn"

import { pageHref } from "@/lib/render/markdown"
import type { ReaderProject } from "@/lib/projects/reader"
import { IconCheck, IconChevronDown } from "@/components/icons"

// Native <details> dropdown, so it needs no client JS. Keyed on the current
// project so it remounts closed after switching.
export function ProjectSwitcher({
  current,
  projects,
}: {
  current: { slug: string; name: string }
  projects: ReaderProject[]
}) {
  return (
    <details key={current.slug} className="group relative min-w-0">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 border border-border px-2 py-1 font-mono text-[13px] font-medium select-none hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span className="max-w-28 truncate sm:max-w-48">{current.name}</span>
        <IconChevronDown
          size={12}
          className="text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <ul className="absolute start-0 top-full z-40 mt-1 min-w-56 border border-border bg-popover py-1 shadow-lg">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={pageHref(p.slug, "")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 font-mono text-[13px] hover:bg-accent",
                p.slug === current.slug ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="w-3.5 shrink-0">
                {p.slug === current.slug && <IconCheck size={13} />}
              </span>
              <span className="truncate">{p.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}
