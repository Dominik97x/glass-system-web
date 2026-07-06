import { Pool } from "pg";
import type { Pool as PgPool, PoolConfig } from "pg";

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
    globalForDatabase.calculatorInquiryPgPool = new Pool(
      createPoolConfig(connectionString)
    );
  }

  return globalForDatabase.calculatorInquiryPgPool;
}

function createPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,
    max: getDatabasePoolMax(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: getDatabaseSslConfig(connectionString),
  };
}

function getDatabasePoolMax(): number {
  const value = Number(process.env.DATABASE_POOL_MAX ?? 5);

  if (!Number.isFinite(value) || value < 1) {
    return 5;
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