import { getConnection } from "@/lib/github/connection"
import { auth } from "@/lib/auth/session"
import { TopBar } from "@/components/chrome/top-bar"
import { AdminNav } from "@/components/admin/admin-nav"
import { IconWarning } from "@/components/icons"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  let banner: string | null = null
  if (session?.user.role === "admin") {
    const connection = await getConnection().catch(() => null)
    if (connection?.status === "error") {
      banner = connection.lastError ?? "GitHub connection has an error."
    }
  }
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar variant="admin" name={session?.user.name || session?.user.email} />
      {banner && (
        <p className="flex items-center gap-2 bg-destructive px-6 py-2.5 font-mono text-[13px] font-medium text-background">
          <IconWarning size={14} className="shrink-0" />
          GitHub: {banner}
        </p>
      )}
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1">
          {/* One width for every admin page. */}
          <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-8 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
