import { NextResponse, after } from "next/server"

import { getConnection } from "@/lib/github/connection"
import { runSync } from "@/lib/sync/sync"
import {
  isRepeatDelivery,
  refMatchesBranch,
  verifySignature,
} from "@/lib/github/webhook"

// GitHub gives up after 10 seconds, so this answers immediately and does the
// sync in after(). Signature check comes before anything else touches the DB.
export async function POST(request: Request) {
  const raw = await request.text()
  const delivery = request.headers.get("x-github-delivery")
  const event = request.headers.get("x-github-event")

  if (
    !verifySignature(
      raw,
      request.headers.get("x-hub-signature-256"),
      process.env.GITHUB_WEBHOOK_SECRET,
    )
  ) {
    console.warn(`[webhook] bad signature, delivery=${delivery ?? "none"}`)
    return NextResponse.json({ error: "Bad signature" }, { status: 401 })
  }

  if (event === "ping") {
    return NextResponse.json({ ok: true, pong: true })
  }

  if (event !== "push") {
    console.info(`[webhook] ignored event=${event}, delivery=${delivery}`)
    return NextResponse.json({ ok: true, skipped: "event" })
  }

  if (isRepeatDelivery(delivery)) {
    console.info(`[webhook] repeat delivery=${delivery}`)
    return NextResponse.json({ ok: true, skipped: "duplicate" })
  }

  const connection = await getConnection()
  if (!connection) {
    console.warn(`[webhook] no connection configured, delivery=${delivery}`)
    return NextResponse.json({ ok: true, skipped: "no-connection" })
  }

  let ref: unknown = null
  try {
    ref = (JSON.parse(raw) as { ref?: unknown }).ref
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 })
  }

  if (!refMatchesBranch(ref, connection.branch)) {
    console.info(
      `[webhook] ignored ref=${String(ref)}, tracking ${connection.branch}, delivery=${delivery}`,
    )
    return NextResponse.json({ ok: true, skipped: "branch" })
  }

  after(async () => {
    try {
      const result = await runSync("webhook")
      console.info(
        `[webhook] delivery=${delivery} sync=${result.status} added=${result.added} changed=${result.changed} removed=${result.removed}`,
      )
    } catch (e) {
      console.error(`[webhook] delivery=${delivery} sync failed:`, e)
    }
  })

  return NextResponse.json({ ok: true, queued: true })
}
