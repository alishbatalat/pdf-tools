import { NextResponse } from "next/server";
import { auth } from "@/auth";

// proxy.ts runs on the Node.js runtime by default (unlike the old
// middleware.ts, which defaulted to Edge), so it's safe to use the full
// auth() here — no need for a separate Edge-safe config.

// Pages that must stay reachable without an account: the sign-in/sign-up
// page itself (obviously), plus legal/support pages that shouldn't require
// a login to read.
const PUBLIC_PAGES = new Set(["/auth/signin", "/privacy", "/help", "/contact"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PAGES.has(pathname) || req.auth) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  // Everything except Next's own internals, static assets, and the auth API
  // routes (which must stay reachable to sign in at all).
  matcher: ["/((?!api/auth|api/signup|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico)$).*)"],
};
