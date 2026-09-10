import { requireAdmin } from "@/lib/auth/admin"
import { listProjects } from "@/lib/projects/projects"
import { listAudit, PHRASES, PURGE_AFTER_DAYS } from "@/lib/admin/danger"
import { PageHeader } from "@/components/ui/page-header"
import { DangerZone } from "@/components/admin/danger-zone"

export default async function DangerPage() {
  await requireAdmin()
  const [projects, audit] = await Promise.all([listProjects(), listAudit()])
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Danger zone" description="Actions that hide or remove things. Each asks for a typed phrase and is logged with your name." />
      <DangerZone
        projects={projects.filter((p) => p.isActive).map((p) => ({ id: p.id, name: p.name, slug: p.slug }))}
        audit={audit.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        purgeDays={PURGE_AFTER_DAYS}
        phrases={PHRASES}
      />
    </div>
  )
}
