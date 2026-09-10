import { cache } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"

import { auth } from "@/lib/auth/session"
import { requireProjectAccess } from "@/lib/access/access"
import { listVisibleProjects } from "@/lib/projects/reader"
import { getPage, listProjectPages } from "@/lib/viewer/pages"
import { buildTree, landingSlug, neighbours, trail } from "@/lib/viewer/tree"
import { pageHref, renderCached } from "@/lib/render/markdown"
import { MAX_BLOB_BYTES } from "@/lib/sync/sync"
import { relativeTime } from "@/lib/format"
import { TopBar } from "@/components/chrome/top-bar"
import { Sidebar } from "@/components/viewer/sidebar"
import { MobileNav } from "@/components/viewer/mobile-nav"
import { ProjectSwitcher } from "@/components/viewer/project-switcher"
import { Article } from "@/components/viewer/article"
import { IconArrowLeft, IconArrowRight, IconClock, IconWarning } from "@/components/icons"

const WARN_BYTES = 1024 * 1024

type Params = Promise<{ projectSlug: string; pageSlug?: string[] }>

function decodeSegment(s: string) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

// Shared by the page and its metadata so the access check and queries run
// once per request.
const loadDoc = cache(async (projectSlug: string, slugParts: string[]) => {
  const session = await auth()
  if (!session) return { session: null } as const

  const project = await requireProjectAccess(session.user, projectSlug)
  if (!project) return { session, missing: true } as const

  const isAdmin = session.user.role === "admin"
  const pages = await listProjectPages(project.id, isAdmin)
  const tree = buildTree(pages)
  const wanted = slugParts.map(decodeSegment).join("/")
  const slug = slugParts.length ? wanted : landingSlug(tree)
  const summary = slug === null ? null : pages.find((p) => p.slug === slug)

  return { session, project, isAdmin, pages, tree, slug: slug ?? "", summary } as const
})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { projectSlug, pageSlug = [] } = await params
  const doc = await loadDoc(projectSlug, pageSlug)
  if (!doc.session || "missing" in doc || !doc.summary) return { title: "Page not found" }
  return { title: `${doc.summary.title} · ${doc.project.name}` }
}

export default async function DocPage({ params }: { params: Params }) {
  const { projectSlug, pageSlug = [] } = await params
  const doc = await loadDoc(projectSlug, pageSlug)
  if (!doc.session) redirect("/login")
  // No such project, archived, or not a member: all the same 404.
  if ("missing" in doc) notFound()

  const { session, project, isAdmin, pages, tree, slug, summary } = doc
  const visible = await listVisibleProjects(session.user.id, session.user.role)

  const sidebar = (
    <Sidebar
      projectSlug={project.slug}
      projectName={project.name}
      tree={tree}
      activeSlug={summary ? slug : ""}
    />
  )
  const shell = (content: React.ReactNode) => (
    <div className="flex min-h-svh flex-col">
      <TopBar
        email={session.user.email}
        lead={<MobileNav>{sidebar}</MobileNav>}
        start={<ProjectSwitcher current={project} projects={visible} />}
      />
      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 self-start border-e border-border bg-sidebar md:flex xl:w-70 print:hidden">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 px-6 py-10 xl:px-10">
          <div className="mx-auto w-full max-w-[672px]">{content}</div>
        </main>
      </div>
    </div>
  )

  // A project that synced but has no Markdown yet.
  if (pages.length === 0) {
    return shell(
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold">{project.name}</h1>
        <p className="text-[15px] text-muted-foreground">
          No pages yet. Push Markdown to the repo and it shows up here after the next sync.
        </p>
      </div>,
    )
  }

  if (!summary) notFound()
  const page = await getPage(summary.id)
  if (!page) notFound()

  const tooLarge = page.size > MAX_BLOB_BYTES
  if (page.size > WARN_BYTES) {
    console.warn(`[viewer] large page ${page.path} (${page.size} bytes)`)
  }

  // Any page added, changed or removed in the project changes this, so
  // wikilinks that were unresolved re-render once their target appears.
  const generation = `${pages.length}:${Math.max(...pages.map((p) => p.updatedAt.getTime()))}`
  const html =
    tooLarge || !page.content.trim()
      ? ""
      : await renderCached(
          `${page.id}:${page.blobSha}:${generation}:${isAdmin ? "a" : "v"}`,
          page.content,
          {
            projectSlug: project.slug,
            projectRepoPath: project.repoPath,
            pagePath: page.path,
            pages: pages.map((p) => ({ path: p.path, slug: p.slug })),
          },
        )

  const crumbs = trail(tree, slug)
  const { prev, next } = neighbours(tree, slug)

  return shell(
    <article className="flex flex-col">
      <nav aria-label="Breadcrumb" className="font-mono text-[13px] text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-x-1.5">
          <li>
            <Link href={pageHref(project.slug, "")} className="hover:text-foreground">
              {project.name}
            </Link>
          </li>
          {crumbs.map((c) => (
            <li key={c.title} className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              {c.slug !== null ? (
                <Link href={pageHref(project.slug, c.slug)} className="hover:text-foreground">
                  {c.title}
                </Link>
              ) : (
                <span>{c.title}</span>
              )}
            </li>
          ))}
          {slug !== "" && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <span aria-current="page" className="text-foreground">{page.title}</span>
            </li>
          )}
        </ol>
      </nav>

      <div className="mt-3.5 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
          {page.title}
        </h1>
        {page.isDraft === 1 && (
          <span className="bg-status-warning px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.08em] text-background uppercase">
            Draft
          </span>
        )}
      </div>

      {page.description && (
        <p className="mt-2 font-sans text-[15px] leading-relaxed text-muted-foreground">
          {page.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <IconClock size={12} />
          Updated {relativeTime(page.updatedAt)}
        </span>
        {isAdmin && page.status === "stale" && (
          <span className="flex items-center gap-1.5 text-status-warning">
            <IconWarning size={12} />
            Showing last good copy.
          </span>
        )}
      </div>

      <hr className="my-6 border-border" />

      {tooLarge ? (
        <p className="flex items-center gap-2 font-mono text-[13px] text-muted-foreground">
          <IconWarning size={14} />
          This file is too large to render.
        </p>
      ) : html ? (
        <Article html={html} />
      ) : (
        <p className="font-mono text-[13px] text-muted-foreground">This page is empty.</p>
      )}

      {(prev || next) && (
        <nav aria-label="Pages" className="mt-12 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 print:hidden">
          {prev ? (
            <Link
              href={pageHref(project.slug, prev.slug)}
              className="flex flex-col gap-1.5 border border-border px-3.5 py-3 hover:border-ring"
            >
              <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Previous
              </span>
              <span className="flex items-center gap-2 font-mono text-sm font-medium">
                <IconArrowLeft size={14} />
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={pageHref(project.slug, next.slug)}
              className="flex flex-col items-end gap-1.5 border border-border px-3.5 py-3 text-end hover:border-ring"
            >
              <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Next
              </span>
              <span className="flex items-center gap-2 font-mono text-sm font-medium">
                {next.title}
                <IconArrowRight size={14} />
              </span>
            </Link>
          )}
        </nav>
      )}
    </article>,
  )
}
