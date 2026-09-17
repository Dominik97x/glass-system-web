import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE_NAME,
  type AdminSession,
  verifyAdminSessionToken,
} from "@/auth/admin-auth";

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  return verifyAdminSessionToken(token);
}

function sanitizeAdminReturnPath(path: string): string {
  if (
    path.startsWith("/admin/") &&
    !path.startsWith("//") &&
    !path.startsWith("/admin/logowanie")
  ) {
    return path;
  }

  return "/admin/leady";
}

export async function requireAdminSession(
  returnPath = "/admin/leady"
): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    const safeReturnPath = sanitizeAdminReturnPath(returnPath);
    redirect(`/admin/logowanie?next=${encodeURIComponent(safeReturnPath)}`);
  }

  return session;
}
