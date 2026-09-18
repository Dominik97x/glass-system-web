interface RequestRateLimitRecord {
  count: number;
  resetAt: number;
}

interface RequestRateLimitOptions {
  bucket: string;
  limit: number;
  windowMs: number;
}

interface RequestRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

declare global {
  var __moonglassRequestRateLimits:
    | Map<string, RequestRateLimitRecord>
    | undefined;
}

function getRateLimitStore(): Map<string, RequestRateLimitRecord> {
  if (!globalThis.__moonglassRequestRateLimits) {
    globalThis.__moonglassRequestRateLimits = new Map();
  }

  return globalThis.__moonglassRequestRateLimits;
}

function cleanupExpiredRecords(now: number): void {
  const store = getRateLimitStore();

  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }
}

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedAddress = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwardedAddress ||
    request.headers.get("x-real-ip")?.trim() ||
    "local-unknown"
  );
}

export function consumeRequestRateLimit(
  request: Request,
  options: RequestRateLimitOptions
): RequestRateLimitResult {
  const now = Date.now();
  cleanupExpiredRecords(now);

  const store = getRateLimitStore();
  const key = `${options.bucket}:${getClientKey(request)}`;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      ),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}