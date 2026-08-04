import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "moonglass_admin_session";

const PASSWORD_HASH_PREFIX = "scrypt-v1";
const SESSION_TOKEN_VERSION = 1;
const SESSION_SECRET_MIN_LENGTH = 32;
const DEFAULT_SESSION_TTL_HOURS = 12;
const MAX_SESSION_TTL_HOURS = 168;

interface AdminSessionPayload {
  version: number;
  username: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export interface AdminSession {
  username: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface AdminAuthConfiguration {
  username: string;
  passwordHash: string;
  sessionSecret: string;
  sessionTtlSeconds: number;
}

export type AdminAuthConfigurationResult =
  | {
      configured: true;
      configuration: AdminAuthConfiguration;
    }
  | {
      configured: false;
      message: string;
    };

function readRequiredEnvironmentVariable(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function readSessionTtlSeconds(): number {
  const rawValue = process.env.ADMIN_SESSION_TTL_HOURS?.trim();
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_SESSION_TTL_HOURS;

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_SESSION_TTL_HOURS * 60 * 60;
  }

  const boundedHours = Math.min(
    Math.max(Math.floor(parsedValue), 1),
    MAX_SESSION_TTL_HOURS
  );

  return boundedHours * 60 * 60;
}

export function getAdminAuthConfiguration(): AdminAuthConfigurationResult {
  const username = readRequiredEnvironmentVariable("ADMIN_USERNAME");
  const passwordHash = readRequiredEnvironmentVariable("ADMIN_PASSWORD_HASH");
  const sessionSecret = readRequiredEnvironmentVariable("ADMIN_SESSION_SECRET");

  if (!username || !passwordHash || !sessionSecret) {
    return {
      configured: false,
      message:
        "Brakuje ADMIN_USERNAME, ADMIN_PASSWORD_HASH lub ADMIN_SESSION_SECRET.",
    };
  }

  if (sessionSecret.length < SESSION_SECRET_MIN_LENGTH) {
    return {
      configured: false,
      message: `ADMIN_SESSION_SECRET musi mieć co najmniej ${SESSION_SECRET_MIN_LENGTH} znaki.`,
    };
  }

  if (!passwordHash.startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    return {
      configured: false,
      message: "ADMIN_PASSWORD_HASH ma nieobsługiwany format.",
    };
  }

  return {
    configured: true,
    configuration: {
      username,
      passwordHash,
      sessionSecret,
      sessionTtlSeconds: readSessionTtlSeconds(),
    },
  };
}

function decodePasswordHash(passwordHash: string): {
  salt: Buffer;
  expectedHash: Buffer;
} | null {
  const parts = passwordHash.split("$");

  if (parts.length !== 3 || parts[0] !== PASSWORD_HASH_PREFIX) {
    return null;
  }

  try {
    const salt = Buffer.from(parts[1], "base64url");
    const expectedHash = Buffer.from(parts[2], "base64url");

    if (salt.length < 16 || expectedHash.length !== 64) {
      return null;
    }

    return { salt, expectedHash };
  } catch {
    return null;
  }
}

export function verifyAdminCredentials(
  submittedUsername: string,
  submittedPassword: string
): boolean {
  const result = getAdminAuthConfiguration();

  if (!result.configured) {
    return false;
  }

  const { username, passwordHash } = result.configuration;
  const usernameBuffer = Buffer.from(username, "utf8");
  const submittedUsernameBuffer = Buffer.from(submittedUsername, "utf8");

  const usernameMatches =
    usernameBuffer.length === submittedUsernameBuffer.length &&
    timingSafeEqual(usernameBuffer, submittedUsernameBuffer);

  const decodedPasswordHash = decodePasswordHash(passwordHash);

  if (!decodedPasswordHash) {
    return false;
  }

  const submittedPasswordHash = scryptSync(
    submittedPassword,
    decodedPasswordHash.salt,
    decodedPasswordHash.expectedHash.length
  );

  const passwordMatches = timingSafeEqual(
    decodedPasswordHash.expectedHash,
    submittedPasswordHash
  );

  return usernameMatches && passwordMatches;
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createAdminSessionToken(): {
  token: string;
  expiresAt: Date;
} {
  const result = getAdminAuthConfiguration();

  if (!result.configured) {
    throw new Error(result.message);
  }

  const { username, sessionSecret, sessionTtlSeconds } = result.configuration;
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + sessionTtlSeconds;

  const payload: AdminSessionPayload = {
    version: SESSION_TOKEN_VERSION,
    username,
    issuedAt,
    expiresAt,
    nonce: randomBytes(16).toString("base64url"),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = signPayload(encodedPayload, sessionSecret);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(expiresAt * 1000),
  };
}

function isAdminSessionPayload(value: unknown): value is AdminSessionPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    payload.version === SESSION_TOKEN_VERSION &&
    typeof payload.username === "string" &&
    typeof payload.issuedAt === "number" &&
    Number.isFinite(payload.issuedAt) &&
    typeof payload.expiresAt === "number" &&
    Number.isFinite(payload.expiresAt) &&
    typeof payload.nonce === "string" &&
    payload.nonce.length > 0
  );
}

export function verifyAdminSessionToken(
  token: string | null | undefined
): AdminSession | null {
  if (!token) {
    return null;
  }

  const result = getAdminAuthConfiguration();

  if (!result.configured) {
    return null;
  }

  const tokenParts = token.split(".");

  if (tokenParts.length !== 2) {
    return null;
  }

  const [encodedPayload, providedSignature] = tokenParts;
  const expectedSignature = signPayload(
    encodedPayload,
    result.configuration.sessionSecret
  );
  const providedSignatureBuffer = Buffer.from(providedSignature, "utf8");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );
  } catch {
    return null;
  }

  if (!isAdminSessionPayload(payload)) {
    return null;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (
    payload.username !== result.configuration.username ||
    payload.issuedAt > currentTimestamp + 60 ||
    payload.expiresAt <= currentTimestamp ||
    payload.expiresAt <= payload.issuedAt
  ) {
    return null;
  }

  return {
    username: payload.username,
    issuedAt: new Date(payload.issuedAt * 1000),
    expiresAt: new Date(payload.expiresAt * 1000),
  };
}

export function getAdminSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires: expiresAt,
  };
}
