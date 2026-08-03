import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/cookie";

const PROTECTED_PATHS = ["/", "/portfolios", "/watchlist"];
const AUTH_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(AUTH_COOKIE_NAME);

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_PATHS.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
