import Link from "next/link"
import { cn } from "cn"

import { pageHref } from "@/lib/render/paths"
import { openFolders, type TreeNode } from "@/lib/viewer/tree"
import {
  IconArrowLeft,
  IconChevronRight,
  IconFile,
  IconFolder,
  IconRepo,
} from "@/components/icons"

// Server rendered. Folders are native <details>, so they open and close with
// no client JS, and the ones on the path to the active page start open.
export function Sidebar({
  projectSlug,
  projectName,
  tree,
  activeSlug,
}: {
  projectSlug: string
  projectName: string
  tree: TreeNode[]
  activeSlug: string
}) {
  const open = openFolders(activeSlug)
  return (
    <nav aria-label="Pages" className="flex h-full w-full flex-col">
      <Link
        href={pageHref(projectSlug, "")}
        className="flex items-center gap-2 px-4 py-4 text-foreground"
      >
        <IconRepo size={16} className="shrink-0" />
        <span className="truncate font-heading text-base font-medium">{projectName}</span>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {tree.length === 0 ? (
          <p className="px-2 py-2 font-mono text-xs text-muted-foreground">No pages yet.</p>
        ) : (
          <Nodes
            nodes={tree}
            depth={0}
            projectSlug={projectSlug}
            activeSlug={activeSlug}
            open={open}
          />
        )}
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 border-t border-border px-4 py-3.5 font-mono text-[13px] text-muted-foreground hover:text-foreground"
      >
        <IconArrowLeft size={14} />
        Back to projects
      </Link>
    </nav>
  )
}

function Nodes({
  nodes,
  depth,
  projectSlug,
  activeSlug,
  open,
}: {
  nodes: TreeNode[]
  depth: number
  projectSlug: string
  activeSlug: string
  open: Set<string>
}) {
  // Nesting reads from a guide line under the parent folder's arrow, the
  // way Obsidian and VS Code draw it: each level steps in 16px, and pages
  // carry an arrow-wide spacer so their icon lines up with folder icons.
  return (
    <ul className={cn("flex flex-col gap-px", depth > 0 && "ms-[15px] border-s border-border")}>
      {nodes.map((node) => {
        if (node.kind === "page") {
          const active = node.slug === activeSlug
          return (
            <li key={`p:${node.slug}`}>
              <Link
                href={pageHref(projectSlug, node.slug)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 border-s-2 py-1.5 ps-2 pe-2 font-mono text-[13px]",
                  active
                    ? "border-primary bg-accent font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span aria-hidden className="w-3 shrink-0" />
                <IconFile size={14} className="shrink-0" />
                <span className="truncate">{node.title}</span>
              </Link>
            </li>
          )
        }

        const activeIndex = node.indexSlug !== null && node.indexSlug === activeSlug
        return (
          <li key={`f:${node.path}`}>
            <details open={open.has(node.path)} className="group">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center gap-1.5 border-s-2 py-1.5 ps-2 pe-2 font-mono text-[13px] font-medium select-none [&::-webkit-details-marker]:hidden",
                  activeIndex
                    ? "border-primary bg-accent text-foreground"
                    : "border-transparent text-foreground hover:bg-accent/60",
                )}
              >
                <IconChevronRight
                  size={12}
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                />
                <IconFolder size={14} className="shrink-0 text-muted-foreground" />
                {node.indexSlug !== null ? (
                  <Link
                    href={pageHref(projectSlug, node.indexSlug)}
                    aria-current={activeIndex ? "page" : undefined}
                    className="truncate hover:underline"
                  >
                    {node.title}
                  </Link>
                ) : (
                  <span className="truncate">{node.title}</span>
                )}
              </summary>
              <Nodes
                nodes={node.children}
                depth={depth + 1}
                projectSlug={projectSlug}
                activeSlug={activeSlug}
                open={open}
              />
            </details>
          </li>
        )
      })}
    </ul>
  )
}
