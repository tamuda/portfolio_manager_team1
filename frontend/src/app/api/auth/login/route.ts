import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api/client";
import { setAuthCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();

  const backendResponse = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const detail = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(
      { error: detail.detail ?? "Login failed" },
      { status: backendResponse.status },
    );
  }

  const { access_token: accessToken } = await backendResponse.json();
  await setAuthCookie(accessToken);

  return NextResponse.json({ success: true });
}
