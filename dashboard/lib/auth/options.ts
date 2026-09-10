import Credentials from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import { compare } from "bcryptjs"
import { eq } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { DrizzleAdapter } from "./adapter"
import { checkRateLimit } from "./rate-limit"
import { ensureSeeded } from "./seed"

const REMEMBER_MAX_AGE = 30 * 24 * 3600
const SHORT_SESSION_MS = 12 * 3600 * 1000

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(),
  // v4 supports Credentials only with JWT. Revoke still works because
  // the session callback rechecks the user row on every call.
  // "Keep me logged in" picks between these two windows. The cookie itself
  // carries the long one; the session callback enforces the short one.
  session: { strategy: "jwt", maxAge: REMEMBER_MAX_AGE, updateAge: 24 * 3600 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Keep me logged in", type: "checkbox" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.toLowerCase().trim() ?? ""
        const password = credentials?.password ?? ""
        if (!email || !password) return null

        const forwarded = req?.headers?.["x-forwarded-for"]
        const ip =
          (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ??
          "unknown"
        if (!checkRateLimit(`login:${ip}`) || !checkRateLimit(`login:${email}`)) {
          return null
        }

        await ensureSeeded()
        const db = await getDb()
        const [row] = await db.select().from(users).where(eq(users.email, email))
        // Same null for missing user, inactive user, or bad password.
        // ponytail: in-memory rate limit resets on restart, shared store if multi-instance
        if (!row || !row.isActive || !row.passwordHash) return null
        const ok = await compare(password, row.passwordHash)
        if (!ok) return null
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, row.id))
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          image: row.image,
          remember: credentials?.remember === "true",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.remember = (user as { remember?: boolean }).remember === true
        token.loginAt = Date.now()
      }
      return token
    },
    async session({ session, token }) {
      // Row is rechecked on every call, so deactivating a user locks
      // them out on next request even though the token itself is JWT.
      if (session.user) {
        session.user.id = ""
        session.user.role = "viewer"
        session.user.mustChangePassword = false
        session.user.active = false
        // Without "keep me logged in" the session dies after 12 hours even
        // though the cookie would live longer.
        const remember = token.remember === true
        const loginAt = typeof token.loginAt === "number" ? token.loginAt : 0
        const lapsed =
          !remember && loginAt > 0 && Date.now() - loginAt > SHORT_SESSION_MS

        const id = token.id as string | undefined
        if (id && !lapsed) {
          const db = await getDb()
          const [row] = await db.select().from(users).where(eq(users.id, id))
          // "Revoke sessions" stamps the user row; any token issued before
          // that stamp stops working here, on its very next request. Tokens
          // from before loginAt existed count as issued at 0, so they go too.
          const revoked =
            row?.sessionsRevokedAt != null && loginAt < row.sessionsRevokedAt.getTime()
          if (row && row.isActive && !revoked) {
            session.user.id = row.id
            // From the row, so the top bar and audit lines follow edits.
            session.user.name = row.name
            session.user.email = row.email
            session.user.role = row.role
            session.user.mustChangePassword = Boolean(row.mustChangePassword)
            session.user.active = true
          }
        }
      }
      return session
    },
  },
}
