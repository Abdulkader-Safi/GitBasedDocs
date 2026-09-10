import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/admin"

import { ProjectsManager } from "./projects-manager"

export const metadata: Metadata = { title: "Projects · Admin" }

export default async function ProjectsPage() {
  await requireAdmin()
  return (
    <div className="flex flex-col gap-6">
      <ProjectsManager />
    </div>
  )
}
