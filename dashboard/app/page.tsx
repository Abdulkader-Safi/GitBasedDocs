import type { Metadata } from "next"
import Link from "next/link"

import { requireSession } from "@/lib/auth/session"
import { listVisibleProjects } from "@/lib/projects/reader"
import { plural, relativeTime } from "@/lib/format"
import { TopBar } from "@/components/chrome/top-bar"
import { PageHeader } from "@/components/ui/page-header"
import {
  IconArrowRight,
  IconClock,
  IconFile,
  IconRepo,
} from "@/components/icons"

// Same folder as the root layout, so its title template does not apply here.
export const metadata: Metadata = { title: { absolute: "Projects · GitBasedDocs" } }

export default async function HomePage() {
  const session = await requireSession()

  const list = await listVisibleProjects(session.user.id, session.user.role)

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar name={session.user.name || session.user.email} isAdmin={session.user.role === "admin"} />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
          <PageHeader
            title="Projects"
            description="Docs shared with your account"
          />

          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 border border-border bg-card px-6 py-16 text-center">
              <IconRepo size={20} className="text-muted-foreground" />
              <p className="text-[15px] text-muted-foreground">
                No projects shared with you yet. Contact your admin.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/p/${project.slug}`}
                    className="group flex h-full flex-col gap-3 border border-border bg-card px-5 py-5 transition-colors hover:border-ring"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center bg-muted">
                        <IconRepo size={15} />
                      </span>
                      <h2 className="font-heading text-base font-medium text-foreground">
                        {project.name}
                      </h2>
                      <IconArrowRight
                        size={15}
                        className="ms-auto text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </div>

                    {project.description && (
                      <p className="line-clamp-2 text-[13px] text-muted-foreground">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <IconClock size={12} />
                      {relativeTime(project.updatedAt)}
                      <span aria-hidden>·</span>
                      <IconFile size={12} />
                      {plural(project.pageCount, "page")}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
