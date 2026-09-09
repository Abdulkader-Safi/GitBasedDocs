import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Fast cookie-presence gate. Real validation happens in pages and
// API routes via getServerSession, which redirect or 401 on miss.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    // GitHub sends no cookie. This route authenticates with an HMAC
    // signature instead, so the cookie gate must not redirect it.
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }
  const token =
    request.cookies.get("next-auth.session-token")?.value ??
    request.cookies.get("__Secure-next-auth.session-token")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}
