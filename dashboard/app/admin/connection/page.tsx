import { headers } from "next/headers"

import { requireAdmin } from "@/lib/auth/admin"

import { ConnectionForm } from "./connection-form"

export default async function ConnectionPage() {
  await requireAdmin()

  // Build the webhook URL from the request so it is right behind a proxy
  // (Tailscale, ngrok, a reverse proxy) instead of guessing localhost.
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")

  return (
    <div className="mx-auto w-full max-w-[896px] px-6 py-8">
      <ConnectionForm webhookUrl={`${proto}://${host}/api/webhooks/github`} />
    </div>
  )
}
