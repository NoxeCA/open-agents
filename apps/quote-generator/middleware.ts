import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isDevAuthBypassed } from "@/lib/dev-auth";

export function middleware(request: NextRequest) {
  if (isDevAuthBypassed()) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/quotes/:path*", "/api/chat", "/api/quotes/:path*"],
};
