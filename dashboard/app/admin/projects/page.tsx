import { requireAdmin } from "@/lib/auth/admin"

import { ProjectsManager } from "./projects-manager"

export default async function ProjectsPage() {
  await requireAdmin()
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <ProjectsManager />
    </div>
  )
}
