import { cache } from "react"
import { createHash } from "node:crypto"
import Link from "next/link"
import { cn } from "cn"
import { notFound, redirect } from "next/navigation"
import { after } from "next/server"
import type { Metadata } from "next"
import "katex/dist/katex.min.css"

import { auth } from "@/lib/auth/session"
import { checkProjectAccess, logAccess } from "@/lib/access/access"
import { listVisibleProjects } from "@/lib/projects/reader"
import {
  getPage,
  listProjectAssetPaths,
  listProjectPages,
} from "@/lib/viewer/pages"
import { buildTree, landingSlug, neighbours, trail } from "@/lib/viewer/tree"
import {
  outline,
  pageHref,
  renderCached,
  type OutlineItem,
} from "@/lib/render/markdown"
import { getConnection } from "@/lib/github/connection"
import { MAX_BLOB_BYTES } from "@/lib/sync/sync"
import { relativeTime } from "@/lib/format"
import { TopBar } from "@/components/chrome/top-bar"
import { Sidebar } from "@/components/viewer/sidebar"
import { MobileNav } from "@/components/viewer/mobile-nav"
import { ProjectSwitcher } from "@/components/viewer/project-switcher"
import { Article } from "@/components/viewer/article"
import { SearchPalette } from "@/components/viewer/search-palette"
import { Outline } from "@/components/viewer/outline"
import { OutlineToggle, PageWidthMenu } from "@/components/viewer/page-controls"
import { Chip } from "@/components/ui/status-badge"
import {
  IconArrowLeft,
  IconArrowRight,
  IconClock,
  IconList,
  IconRepo,
  IconWarning,
} from "@/components/icons"

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

  const { project, allowed } = await checkProjectAccess(
    session.user,
    projectSlug
  )
  // Keep the id of a project the person was refused, for the admin log only.
  if (!project || !allowed)
    return { session, missing: true, attempted: project?.id ?? null } as const

  const isAdmin = session.user.role === "admin"
  // Editors preview drafts too; that is what the role is for.
  const seesDrafts = isAdmin || session.user.role === "editor"
  const pages = await listProjectPages(project.id, seesDrafts)
  const tree = buildTree(pages)
  const wanted = slugParts.map(decodeSegment).join("/")
  const slug = slugParts.length ? wanted : landingSlug(tree)
  const summary = slug === null ? null : pages.find((p) => p.slug === slug)

  return {
    session,
    project,
    isAdmin,
    seesDrafts,
    pages,
    tree,
    slug: slug ?? "",
    summary,
  } as const
})

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { projectSlug, pageSlug = [] } = await params
  const doc = await loadDoc(projectSlug, pageSlug)
  if (!doc.session || "missing" in doc || !doc.summary)
    return { title: "Page not found" }
  return { title: `${doc.summary.title} · ${doc.project.name}` }
}

export default async function DocPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Promise<{ q?: string }>
}) {
  const { projectSlug, pageSlug = [] } = await params
  // Set when arriving from a search result, so the page can mark the term.
  const highlight = ((await searchParams).q ?? "").slice(0, 200)
  const doc = await loadDoc(projectSlug, pageSlug)
  if (!doc.session) redirect("/login")
  if (doc.session.user.mustChangePassword) redirect("/account/password")
  const userId = doc.session.user.id
  const requested = `/p/${projectSlug}${pageSlug.length ? `/${pageSlug.join("/")}` : ""}`
  // No such project, archived, or not a member: all the same 404, and a
  // denied line in the admin access log.
  if ("missing" in doc) {
    const attempted = doc.attempted ?? null
    after(() =>
      logAccess({
        userId,
        projectId: attempted,
        path: requested,
        allowed: false,
      })
    )
    notFound()
  }

  const { session, project, isAdmin, seesDrafts, pages, tree, slug, summary } = doc
  const visible = await listVisibleProjects(session.user.id, session.user.role)

  const sidebar = (
    <Sidebar
      projectSlug={project.slug}
      projectName={project.name}
      tree={tree}
      activeSlug={summary ? slug : ""}
    />
  )
  const shell = (content: React.ReactNode, toc: OutlineItem[] = []) => (
    <div className="flex min-h-svh flex-col">
      <TopBar
        email={session.user.email}
        isAdmin={isAdmin}
        lead={<MobileNav>{sidebar}</MobileNav>}
        start={<ProjectSwitcher current={project} projects={visible} />}
      >
        <PageWidthMenu />
        {toc.length > 1 && <OutlineToggle className="hidden xl:flex" />}
        <SearchPalette projectSlug={project.slug} projectName={project.name} />
      </TopBar>
      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 self-start border-e border-border bg-sidebar md:flex xl:w-70 print:hidden">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 px-6 py-10 xl:px-10">
          {/* Width comes from the reader's choice on <html> (globals.css). */}
          <div className="doc-body mx-auto w-full min-w-0">{content}</div>
        </main>
        {/* Only worth a panel with two or more headings to jump between. */}
        {toc.length > 1 && (
          <aside className="doc-outline sticky top-14 hidden h-[calc(100svh-3.5rem)] w-64 shrink-0 flex-col self-start border-s border-border bg-sidebar xl:flex print:hidden">
            <div className="flex items-center gap-2 py-3 ps-4 pe-2">
              <IconList size={14} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                On this page
              </span>
              <OutlineToggle />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <Outline items={toc} />
            </div>
          </aside>
        )}
      </div>
    </div>
  )

  // A project that synced but has no Markdown yet.
  if (pages.length === 0) {
    return shell(
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold">{project.name}</h1>
        <p className="text-[15px] text-muted-foreground">
          No pages yet. Push Markdown to the repo and it shows up here after the
          next sync.
        </p>
      </div>
    )
  }

  if (!summary) notFound()
  const page = await getPage(summary.id)
  if (!page) notFound()
  after(() =>
    logAccess({ userId, projectId: project.id, path: requested, allowed: true })
  )

  const tooLarge = page.size > MAX_BLOB_BYTES
  if (page.size > WARN_BYTES) {
    console.warn(`[viewer] large page ${page.path} (${page.size} bytes)`)
  }

  const assetPaths = await listProjectAssetPaths(project.id)

  // Any page or asset added, changed or removed in the project changes this,
  // so an unresolved wikilink or a missing image box re-renders once its
  // target appears.
  const generation = [
    pages.length,
    Math.max(...pages.map((p) => p.updatedAt.getTime())),
    createHash("sha1")
      .update([...assetPaths].sort().join("\n"))
      .digest("hex")
      .slice(0, 10),
  ].join(":")
  const html =
    tooLarge || !page.content.trim()
      ? ""
      : await renderCached(
          `${page.id}:${page.blobSha}:${generation}:${seesDrafts ? "d" : "v"}`,
          page.content,
          {
            projectSlug: project.slug,
            projectRepoPath: project.repoPath,
            pagePath: page.path,
            pages: pages.map((p) => ({ path: p.path, slug: p.slug })),
            assets: assetPaths,
          }
        )

  const crumbs = trail(tree, slug)
  const toc = html ? outline(html) : []
  // Writers (admins, editors) get a link to the source file. Readers may
  // not have access to the private repo, so they do not.
  const connection =
    session.user.role === "viewer" ? null : await getConnection()
  const githubUrl = connection
    ? `https://github.com/${connection.owner}/${connection.repo}/blob/${encodeURIComponent(connection.branch)}/${page.path.split("/").map(encodeURIComponent).join("/")}`
    : null
  const { prev, next } = neighbours(tree, slug)

  return shell(
    <article className="flex flex-col">
      {pageSlug.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="font-mono text-[13px] text-muted-foreground"
        >
          <ol className="flex flex-wrap items-center gap-x-1.5">
            <li>
              <Link
                href={pageHref(project.slug, "")}
                className="hover:text-foreground"
              >
                {project.name}
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.title} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                {c.slug !== null ? (
                  <Link
                    href={pageHref(project.slug, c.slug)}
                    className="hover:text-foreground"
                  >
                    {c.title}
                  </Link>
                ) : (
                  <span>{c.title}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          pageSlug.length > 0 && "mt-3.5"
        )}
      >
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
          {page.title}
        </h1>
        {page.isDraft === 1 && <Chip tone="warning">Draft</Chip>}
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
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <IconRepo size={12} />
            View on GitHub
          </a>
        )}
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
        <Article html={html} highlight={highlight} />
      ) : (
        <p className="font-mono text-[13px] text-muted-foreground">
          This page is empty.
        </p>
      )}

      {(prev || next) && (
        <nav
          aria-label="Pages"
          className="mt-12 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 print:hidden"
        >
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
    toc
  )
}
