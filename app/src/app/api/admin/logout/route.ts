import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME } from "@/auth/admin-auth";
import { isSameOriginAdminRequest } from "@/auth/admin-request-security";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginAdminRequest(request)) {
    return NextResponse.json(
      { success: false, message: "Nieprawidłowe źródło żądania." },
      { status: 403 }
    );
  }

  const response = NextResponse.redirect(
    new URL("/admin/logowanie?loggedOut=1", request.url),
    { status: 303 }
  );

  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
