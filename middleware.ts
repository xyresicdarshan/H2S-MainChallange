import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/**
 * Route protection at the edge. Pages redirect to /login (preserving the
 * intended destination); API routes get a JSON 401. Token verification is
 * cryptographic only (jose) — no DB call — so this stays fast.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (user) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentication required.", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/discover/:path*",
    "/hidden-gems/:path*",
    "/story/:path*",
    "/events/:path*",
    "/saved/:path*",
    "/api/ai/:path*",
    "/api/saved/:path*",
    "/api/preferences/:path*",
  ],
};
