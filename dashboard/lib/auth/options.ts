import Credentials from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import { compare } from "bcryptjs"
import { eq } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { DrizzleAdapter } from "./adapter"
import { checkRateLimit } from "./rate-limit"
import { ensureSeeded } from "./seed"

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(),
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          image: row.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        const db = await getDb()
        const [row] = await db.select().from(users).where(eq(users.id, user.id))
        session.user.role = row?.role ?? "viewer"
        session.user.mustChangePassword = Boolean(row?.mustChangePassword)
      }
      return session
    },
  },
}
