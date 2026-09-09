import { hash } from "bcryptjs"
import { count } from "drizzle-orm"
import { randomUUID } from "crypto"

import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"

// Creates the first admin from env once. Runs inside authorize,
// so it only touches the DB on a real login attempt, never at build.
export async function ensureSeeded() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return
  if (password.length < 10) {
    console.error("ADMIN_PASSWORD must be at least 10 characters. Seed skipped.")
    return
  }
  const db = await getDb()
  const [{ value }] = await db.select({ value: count() }).from(users)
  if (value > 0) return
  const now = new Date()
  await db.insert(users).values({
    id: randomUUID(),
    name: "Admin",
    email,
    passwordHash: await hash(password, 12),
    role: "admin",
    isActive: 1,
    mustChangePassword: 1,
    createdAt: now,
    updatedAt: now,
  })
}
