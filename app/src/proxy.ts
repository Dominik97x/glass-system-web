import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/auth/admin-auth";

const ADMIN_LOGIN_PATH = "/admin/logowanie";
const ADMIN_DEFAULT_PATH = "/admin/leady";

export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifyAdminSessionToken(token);

  if (pathname === ADMIN_LOGIN_PATH) {
    if (session) {
      return NextResponse.redirect(new URL(ADMIN_DEFAULT_PATH, request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
