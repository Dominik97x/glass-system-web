const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

interface LoginAttemptRecord {
  failedAttempts: number;
  windowStartedAt: number;
  blockedUntil: number | null;
}

declare global {
  var __moonglassAdminLoginAttempts:
    | Map<string, LoginAttemptRecord>
    | undefined;
}

function getAttemptStore(): Map<string, LoginAttemptRecord> {
  if (!globalThis.__moonglassAdminLoginAttempts) {
    globalThis.__moonglassAdminLoginAttempts = new Map();
  }

  return globalThis.__moonglassAdminLoginAttempts;
}

function cleanupExpiredRecords(now: number): void {
  const attemptStore = getAttemptStore();

  for (const [key, record] of attemptStore.entries()) {
    const blockExpired = !record.blockedUntil || record.blockedUntil <= now;
    const windowExpired = now - record.windowStartedAt > LOGIN_WINDOW_MS;

    if (blockExpired && windowExpired) {
      attemptStore.delete(key);
    }
  }
}

export function isAdminLoginBlocked(key: string): boolean {
  const now = Date.now();
  cleanupExpiredRecords(now);

  const record = getAttemptStore().get(key);
  return Boolean(record?.blockedUntil && record.blockedUntil > now);
}

export function recordFailedAdminLogin(key: string): void {
  const now = Date.now();
  const attemptStore = getAttemptStore();
  const existingRecord = attemptStore.get(key);

  const record =
    !existingRecord || now - existingRecord.windowStartedAt > LOGIN_WINDOW_MS
      ? {
          failedAttempts: 0,
          windowStartedAt: now,
          blockedUntil: null,
        }
      : existingRecord;

  record.failedAttempts += 1;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + LOGIN_BLOCK_MS;
  }

  attemptStore.set(key, record);
}

export function clearAdminLoginAttempts(key: string): void {
  getAttemptStore().delete(key);
}

export function getAdminLoginRateLimitKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedAddress = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwardedAddress ||
    request.headers.get("x-real-ip")?.trim() ||
    "local-unknown"
  );
}
