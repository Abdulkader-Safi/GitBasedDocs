import Link from "next/link"

import { requireAdmin } from "@/lib/auth/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage() {
  await requireAdmin()
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-medium">Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>GitHub connection</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin/connection" className="text-sm underline">
            Open connection settings
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin/projects" className="text-sm underline">
            Manage projects
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
