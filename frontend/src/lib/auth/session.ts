/** Server-only helpers for setting/clearing the auth cookie from Route Handlers. */

import { cookies } from "next/headers";

import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME } from "@/lib/auth/cookie";

export async function setAuthCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
