import path from "node:path";

import { loadProvisionerEnv } from "./bitrix24/env";
import { Bitrix24FullCatalogManager } from "./bitrix24/full-catalog";

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command === "source") {
    const reportDir = path.resolve(
      process.cwd(),
      process.env.BITRIX24_PROVISIONER_REPORT_DIR?.trim() || ".bitrix24"
    );
    const manager = new Bitrix24FullCatalogManager(process.cwd(), {
      webhookUrl: "https://source-validation.invalid/rest/0/none",
      reportDir,
      requestTimeoutMs: 30_000,
      retryCount: 3,
      pilotDimensions: ["300x306"],
    });
    const report = manager.writeSourceReport();
    console.log("Źródło pełnego katalogu jest poprawne.");
    console.log(`Wymiary: ${report.summary.dimensions}`);
    console.log(`Produkty docelowe: ${report.summary.products}`);
    console.log(`Raport: ${reportDir}`);
    return;
  }

  const env = loadProvisionerEnv();
  const manager = new Bitrix24FullCatalogManager(process.cwd(), env);

  if (command === "plan") {
    const catalogCap = readNumberArgument("--catalog-cap") ?? readEnvNumber("BITRIX24_CATALOG_CAP");
    const report = await manager.plan(catalogCap);
    console.log("Plan pełnego katalogu gotowy.");
    console.log(
      `Docelowo: ${report.desiredProductCount}, utworzyć: ${report.createCount}, zaktualizować: ${report.updateCount}, zgodne: ${report.reuseCount}`
    );
    if (report.catalogCap) {
      console.log(
        `Limit katalogu: ${report.catalogCap}, pozostało: ${report.capRemaining ?? 0}`
      );
    }
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "apply") {
    const report = await manager.apply({
      confirmValue: readArgument("--confirm"),
      paidPlanAcknowledgement: readArgument("--paid-plan"),
      limit: readNumberArgument("--limit"),
      catalogCap:
        readNumberArgument("--catalog-cap") ??
        readEnvNumber("BITRIX24_CATALOG_CAP"),
      delayMs:
        readNumberArgument("--delay-ms") ??
        readEnvNumber("BITRIX24_FULL_CATALOG_DELAY_MS"),
    });
    console.log("Partia pełnego katalogu została zastosowana.");
    console.log(
      `Przetworzono: ${report.processed}, utworzono: ${report.created}, zaktualizowano: ${report.updated}`
    );
    console.log(
      `Pozostało — utworzyć: ${report.remainingCreate}, zaktualizować: ${report.remainingUpdate}`
    );
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "verify") {
    const report = await manager.verify();
    console.log(report.ok ? "Pełny katalog D4 jest zgodny." : "Pełny katalog D4 jest niekompletny.");
    console.log(
      `Brakujące: ${report.createCount}, aktualizacje: ${report.updateCount}, zgodne: ${report.reuseCount}`
    );
    console.log(`Raport: ${env.reportDir}`);
    if (!report.ok) process.exitCode = 2;
    return;
  }

  throw new Error(
    "Nieznane polecenie. Dostępne: source, plan, apply, verify."
  );
}

function readArgument(name: string): string | undefined {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readNumberArgument(name: string): number | undefined {
  const raw = readArgument(name);
  if (raw === undefined || raw === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} musi być liczbą.`);
  }
  return value;
}

function readEnvNumber(name: string): number | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} musi być liczbą.`);
  }
  return value;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
