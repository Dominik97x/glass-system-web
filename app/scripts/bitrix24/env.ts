import fs from "node:fs";
import path from "node:path";

export interface ProvisionerEnv {
  webhookUrl: string;
  reportDir: string;
  requestTimeoutMs: number;
  retryCount: number;
  pilotDimensions: string[];
}

export function loadProvisionerEnv(cwd = process.cwd()): ProvisionerEnv {
  loadEnvFile(path.join(cwd, ".env.local"));
  loadEnvFile(path.join(cwd, ".env"), false);

  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new Error(
      "Brak BITRIX24_WEBHOOK_URL. Utwórz incoming webhook w Bitrix24 i zapisz adres wyłącznie w app/.env.local."
    );
  }

  if (!/^https:\/\//i.test(webhookUrl)) {
    throw new Error("BITRIX24_WEBHOOK_URL musi zaczynać się od https://");
  }

  return {
    webhookUrl: webhookUrl.replace(/\/+$/, ""),
    reportDir: path.resolve(
      cwd,
      process.env.BITRIX24_PROVISIONER_REPORT_DIR?.trim() || ".bitrix24"
    ),
    requestTimeoutMs: readPositiveInt("BITRIX24_REQUEST_TIMEOUT_MS", 30_000),
    retryCount: readPositiveInt("BITRIX24_RETRY_COUNT", 3),
    pilotDimensions: (process.env.BITRIX24_PILOT_DIMENSIONS || "300x306")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  };
}

function loadEnvFile(filePath: string, overwrite = true): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.replace(/\\\$/g, "$");

    if (overwrite || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} musi być dodatnią liczbą całkowitą.`);
  }
  return parsed;
}
