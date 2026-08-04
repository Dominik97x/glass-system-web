import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const confirm = readArgument("--confirm");
  if (confirm !== "MOONGLASS") {
    throw new Error(
      "Migracja D3 modyfikuje bazę i wymaga: npm run db:migrate:d3 -- --confirm=MOONGLASS"
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Brak DATABASE_URL w app/.env.local.");
  }

  const sqlPath = path.resolve(
    process.cwd(),
    "..",
    "database",
    "002_add_bitrix24_sync_state.sql"
  );
  const sql = await readFile(sqlPath, "utf8");
  const pool = new Pool({
    connectionString,
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : connectionString.includes("sslmode=require") ||
            process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    max: 1,
    connectionTimeoutMillis: 20_000,
  });

  try {
    await pool.query(sql);
    console.log("Migracja D3 Bitrix24 została zastosowana.");
  } finally {
    await pool.end();
  }
}

function readArgument(name: string): string | undefined {
  const prefix = `${name}=`;
  const inline = process.argv.find((value: string) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
