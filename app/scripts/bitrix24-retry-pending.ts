import { loadEnvConfig } from "@next/env";
import { CalculatorInquiryBitrix24SyncService } from "../src/inquiries/sync/CalculatorInquiryBitrix24SyncService";
import { CalculatorInquiryBitrix24SyncStore } from "../src/inquiries/sync/CalculatorInquiryBitrix24SyncStore";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const limit = readLimit();

  if (process.argv.includes("--dry-run")) {
    const store = new CalculatorInquiryBitrix24SyncStore();
    const ids = await store.findRetryableIds(limit);

    console.log("Tryb podglądu — baza i Bitrix24 nie zostaną zmienione.");
    console.log(`Do ponowienia: ${ids.length}`);

    for (const id of ids) {
      console.log(`- ${id}`);
    }

    return;
  }

  const service = new CalculatorInquiryBitrix24SyncService();
  const result = await service.retryPending(limit);

  console.log(`Próby: ${result.attempted}`);
  console.log(`Zsynchronizowano: ${result.synced}`);
  console.log(`Błędy: ${result.failed}`);
}

function readLimit(): number {
  const raw = process.argv.find((value: string) => value.startsWith("--limit="));
  const parsed = Number(raw?.slice("--limit=".length) ?? 20);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 20;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
