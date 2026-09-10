import { headers } from "next/headers"

import { requireAdmin } from "@/lib/auth/admin"
import { intervalFromEnv } from "@/lib/sync/schedule"

import { ConnectionForm } from "./connection-form"
import { SyncPanel } from "@/components/admin/sync-panel"

export default async function ConnectionPage() {
  await requireAdmin()

  // Build the webhook URL from the request so it is right behind a proxy
  // (Tailscale, ngrok, a reverse proxy) instead of guessing localhost.
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")

  return (
    <div className="mx-auto flex w-full max-w-[896px] flex-col gap-6 px-6 py-8">
      <ConnectionForm webhookUrl={`${proto}://${host}/api/webhooks/github`} />
      <SyncPanel intervalMinutes={intervalFromEnv(process.env.SYNC_INTERVAL_MINUTES) / 60_000} />
    </div>
  )
}
