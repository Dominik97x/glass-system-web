import { Pool } from "pg";
import type { Pool as PgPool, PoolConfig } from "pg";

const DEFAULT_CONNECTION_TIMEOUT_MS = 20_000;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_ATTEMPTS = 1;

const globalForDatabase = globalThis as typeof globalThis & {
  calculatorInquiryPgPool?: PgPool;
};

export function getCalculatorInquiryDatabasePool(): PgPool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL. Set DATABASE_URL before using CALCULATOR_INQUIRY_REPOSITORY=database."
    );
  }

  if (!globalForDatabase.calculatorInquiryPgPool) {
    const pool = new Pool(createPoolConfig(connectionString));

    // node-postgres requires an error listener for errors emitted by idle clients.
    // A broken idle connection is removed from the global cache, so the next
    // operation creates a fresh pool instead of reusing a stale connection.
    pool.on("error", (error) => {
      console.error("Unexpected Postgres pool error:", error);

      if (globalForDatabase.calculatorInquiryPgPool === pool) {
        delete globalForDatabase.calculatorInquiryPgPool;
      }
    });

    globalForDatabase.calculatorInquiryPgPool = pool;
  }

  return globalForDatabase.calculatorInquiryPgPool;
}

export async function runCalculatorInquiryDatabaseOperation<T>(
  operation: (pool: PgPool) => Promise<T>
): Promise<T> {
  const retryAttempts = getPositiveIntegerEnvironmentValue(
    "DATABASE_RETRY_ATTEMPTS",
    DEFAULT_RETRY_ATTEMPTS,
    0
  );

  let attempt = 0;

  while (true) {
    const pool = getCalculatorInquiryDatabasePool();

    try {
      return await operation(pool);
    } catch (error) {
      if (
        attempt >= retryAttempts ||
        !isTransientDatabaseConnectionError(error)
      ) {
        throw error;
      }

      attempt += 1;

      console.warn(
        `Transient Postgres connection error. Recreating the pool and retrying (${attempt}/${retryAttempts}).`
      );

      await discardCalculatorInquiryDatabasePool(pool);
      await delay(250 * attempt);
    }
  }
}

function createPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,
    max: getPositiveIntegerEnvironmentValue("DATABASE_POOL_MAX", 5, 1),
    idleTimeoutMillis: getPositiveIntegerEnvironmentValue(
      "DATABASE_IDLE_TIMEOUT_MS",
      DEFAULT_IDLE_TIMEOUT_MS,
      1
    ),
    connectionTimeoutMillis: getPositiveIntegerEnvironmentValue(
      "DATABASE_CONNECTION_TIMEOUT_MS",
      DEFAULT_CONNECTION_TIMEOUT_MS,
      1
    ),
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    ssl: getDatabaseSslConfig(connectionString),
    application_name: "glass-system-web",
  };
}

async function discardCalculatorInquiryDatabasePool(
  pool: PgPool
): Promise<void> {
  if (globalForDatabase.calculatorInquiryPgPool === pool) {
    delete globalForDatabase.calculatorInquiryPgPool;
  }

  // Do not let closing a damaged pool block the retry indefinitely.
  await Promise.race([
    pool.end().catch(() => undefined),
    delay(1_000),
  ]);
}

function isTransientDatabaseConnectionError(error: unknown): boolean {
  const transientCodes = new Set([
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EPIPE",
    "08000",
    "08001",
    "08003",
    "08004",
    "08006",
    "08007",
    "08P01",
    "57P01",
    "57P02",
    "57P03",
  ]);

  const messages: string[] = [];
  let current: unknown = error;
  let depth = 0;

  while (current && depth < 4) {
    if (current instanceof Error) {
      messages.push(current.message.toLowerCase());
    }

    if (typeof current === "object" && current !== null) {
      const record = current as Record<string, unknown>;
      const code = record.code;

      if (typeof code === "string" && transientCodes.has(code)) {
        return true;
      }

      current = record.cause;
    } else {
      break;
    }

    depth += 1;
  }

  return messages.some((message) =>
    [
      "connection terminated",
      "connection timeout",
      "connection timed out",
      "terminated unexpectedly",
      "socket hang up",
      "econnreset",
      "etimedout",
      "timeout expired",
      "the database system is starting up",
      "cannot connect now",
    ].some((fragment) => message.includes(fragment))
  );
}

function getPositiveIntegerEnvironmentValue(
  name: string,
  fallback: number,
  minimum: number
): number {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isInteger(value) || value < minimum) {
    return fallback;
  }

  return value;
}

function getDatabaseSslConfig(
  connectionString: string
): PoolConfig["ssl"] {
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  if (
    process.env.DATABASE_SSL === "true" ||
    connectionString.includes("sslmode=require")
  ) {
    return {
      rejectUnauthorized: false,
    };
  }

  return undefined;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
