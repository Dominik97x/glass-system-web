import fs from "node:fs";
import path from "node:path";

export function ensureDirectory(directory: string): void {
  fs.mkdirSync(directory, { recursive: true });
}

export function writeJson(filePath: string, value: unknown): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeText(filePath: string, value: string): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
