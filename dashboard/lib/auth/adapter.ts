import { and, eq } from "drizzle-orm"
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters"
import { randomUUID } from "crypto"

import { getDb } from "@/lib/db"
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema"

function toUser(row: typeof users.$inferSelect): AdapterUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
  }
}

// Custom Drizzle adapter for next-auth v4. The `@auth/*` adapter line
// targets v5 only, so v4 needs these queries by hand. All callers are
// async server code, which matches the async getDb.
export function DrizzleAdapter(): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, "id">) {
      const db = await getDb()
      const now = new Date()
      const id = randomUUID()
      await db.insert(users).values({
        id,
        name: data.name ?? null,
        email: data.email,
        emailVerified: data.emailVerified ?? null,
        image: data.image ?? null,
        createdAt: now,
        updatedAt: now,
      })
      const [row] = await db.select().from(users).where(eq(users.id, id))
      return toUser(row)
    },
    async getUser(id) {
      const db = await getDb()
      const [row] = await db.select().from(users).where(eq(users.id, id))
      return row ? toUser(row) : null
    },
    async getUserByEmail(email) {
      const db = await getDb()
      const [row] = await db.select().from(users).where(eq(users.email, email))
      return row ? toUser(row) : null
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const db = await getDb()
      const [link] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId),
          ),
        )
      if (!link) return null
      const [row] = await db.select().from(users).where(eq(users.id, link.userId))
      return row ? toUser(row) : null
    },
    async updateUser(data) {
      const db = await getDb()
      await db
        .update(users)
        .set({
          name: data.name ?? null,
          email: data.email,
          emailVerified: data.emailVerified ?? null,
          image: data.image ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, data.id))
      const [row] = await db.select().from(users).where(eq(users.id, data.id))
      return toUser(row)
    },
    async linkAccount(data: AdapterAccount) {
      const db = await getDb()
      await db.insert(accounts).values({
        id: randomUUID(),
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refreshToken: data.refresh_token ?? null,
        accessToken: data.access_token ?? null,
        expiresAt: data.expires_at ?? null,
        tokenType: data.token_type ?? null,
        scope: data.scope ?? null,
        idToken: data.id_token ?? null,
        sessionState: data.session_state ?? null,
      })
    },
    async createSession(data: Omit<AdapterSession, "id">) {
      const db = await getDb()
      const id = randomUUID()
      await db.insert(sessions).values({
        id,
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: data.expires,
      })
      const [row] = await db.select().from(sessions).where(eq(sessions.id, id))
      return row as AdapterSession
    },
    async getSessionAndUser(sessionToken) {
      const db = await getDb()
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken))
      if (!session) return null
      const [row] = await db.select().from(users).where(eq(users.id, session.userId))
      if (!row) return null
      return { session: session as AdapterSession, user: toUser(row) }
    },
    async updateSession(data) {
      const db = await getDb()
      if (data.expires) {
        await db
          .update(sessions)
          .set({ expires: data.expires })
          .where(eq(sessions.sessionToken, data.sessionToken))
      }
      const [row] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, data.sessionToken))
      return row as AdapterSession | null
    },
    async deleteSession(sessionToken) {
      const db = await getDb()
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))
    },
    async createVerificationToken(data: VerificationToken) {
      const db = await getDb()
      await db.insert(verificationTokens).values({
        identifier: data.identifier,
        token: data.token,
        expires: data.expires,
      })
      return data
    },
    async useVerificationToken({ identifier, token }) {
      const db = await getDb()
      const [row] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        )
      if (!row) return null
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        )
      return row
    },
  }
}
