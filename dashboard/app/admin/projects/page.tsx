import { requireAdmin } from "@/lib/auth/admin"

import { ProjectsManager } from "./projects-manager"

export default async function ProjectsPage() {
  await requireAdmin()
  return (
    <div className="flex flex-col gap-6">
      <ProjectsManager />
    </div>
  )
}
