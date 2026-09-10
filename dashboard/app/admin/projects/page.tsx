import { requireAdmin } from "@/lib/auth/admin"

import { ProjectsManager } from "./projects-manager"

export default async function ProjectsPage() {
  await requireAdmin()
  return (
    <div className="mx-auto w-full max-w-[896px] px-6 py-8">
      <ProjectsManager />
    </div>
  )
}
