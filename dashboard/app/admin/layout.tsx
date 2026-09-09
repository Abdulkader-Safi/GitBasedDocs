import { getConnection } from "@/lib/github/connection"
import { auth } from "@/lib/auth/session"

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
    <div>
      {banner && (
        <p className="bg-destructive px-6 py-2 text-sm text-destructive-foreground">
          GitHub: {banner}
        </p>
      )}
      {children}
    </div>
  )
}
