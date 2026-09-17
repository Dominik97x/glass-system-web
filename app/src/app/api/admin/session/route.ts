import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionToken,
  getAdminAuthConfiguration,
  getAdminSessionCookieOptions,
  verifyAdminCredentials,
} from "@/auth/admin-auth";
import { isSameOriginAdminRequest } from "@/auth/admin-request-security";
import {
  clearAdminLoginAttempts,
  getAdminLoginRateLimitKey,
  isAdminLoginBlocked,
  recordFailedAdminLogin,
} from "@/auth/admin-login-rate-limit";

export const runtime = "nodejs";

function sanitizeNextPath(value: FormDataEntryValue | null): string {
  if (
    typeof value === "string" &&
    value.startsWith("/admin/") &&
    !value.startsWith("//") &&
    !value.startsWith("/admin/logowanie")
  ) {
    return value;
  }

  return "/admin/leady";
}

function createLoginRedirect(
  request: Request,
  error: "invalid" | "blocked" | "configuration",
  nextPath: string
): NextResponse {
  const loginUrl = new URL("/admin/logowanie", request.url);
  loginUrl.searchParams.set("error", error);
  loginUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(loginUrl, { status: 303 });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginAdminRequest(request)) {
    return NextResponse.json(
      { success: false, message: "Nieprawidłowe źródło żądania." },
      { status: 403 }
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return createLoginRedirect(request, "invalid", "/admin/leady");
  }
  const username = formData.get("username");
  const password = formData.get("password");
  const nextPath = sanitizeNextPath(formData.get("next"));
  const rateLimitKey = getAdminLoginRateLimitKey(request);
  const configuration = getAdminAuthConfiguration();

  if (!configuration.configured) {
    console.error("Admin authentication is not configured:", configuration.message);
    return createLoginRedirect(request, "configuration", nextPath);
  }

  if (isAdminLoginBlocked(rateLimitKey)) {
    return createLoginRedirect(request, "blocked", nextPath);
  }

  const credentialsAreValid =
    typeof username === "string" &&
    username.length <= 256 &&
    typeof password === "string" &&
    password.length <= 512 &&
    verifyAdminCredentials(username.trim(), password);

  if (!credentialsAreValid) {
    recordFailedAdminLogin(rateLimitKey);
    return createLoginRedirect(request, "invalid", nextPath);
  }

  clearAdminLoginAttempts(rateLimitKey);

  const { token, expiresAt } = createAdminSessionToken();
  const response = NextResponse.redirect(new URL(nextPath, request.url), {
    status: 303,
  });

  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    token,
    getAdminSessionCookieOptions(expiresAt)
  );
  response.headers.set("Cache-Control", "no-store");

  return response;
}
