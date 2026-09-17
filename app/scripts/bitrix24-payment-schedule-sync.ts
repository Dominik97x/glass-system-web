import path from "node:path";
import { ProvisionerBitrixClient } from "./bitrix24/client";
import { loadProvisionerEnv } from "./bitrix24/env";
import { writeJson } from "./bitrix24/io";
import {
  evaluatePaymentScheduleSync,
  PAYMENT_SCHEDULE_FIELDS,
  type DealStageSnapshot,
} from "../src/lib/payment-schedule-sync-policy";

const APPLY_CONFIRM_VALUE = "MOONGLASS-PAYMENT-SYNC";
const REPORT_FILE = "payment-schedule-sync.json";

interface BitrixStatus {
  STATUS_ID?: string;
  NAME?: string;
  SORT?: number | string;
  SEMANTICS?: string;
}

async function main(): Promise<void> {
  const dealId = readPositiveIntegerArgument("--deal-id");
  const apply = process.argv.includes("--apply");
  const confirm = readArgument("--confirm");

  const simulateStage = readArgument("--simulate-stage");
  const simulateTotalRaw = readArgument("--simulate-total");
  const simulateContractDate = readArgument("--simulate-contract-date");

  if (
    apply &&
    (simulateStage !== undefined ||
      simulateTotalRaw !== undefined ||
      simulateContractDate !== undefined)
  ) {
    throw new Error(
      "Parametry --simulate-* są dozwolone wyłącznie w trybie DRY-RUN."
    );
  }

  const env = loadProvisionerEnv();
  const client = new ProvisionerBitrixClient(
    env.webhookUrl,
    env.requestTimeoutMs,
    env.retryCount
  );

  const deal = await client.call<Record<string, unknown>>("crm.deal.get", {
    id: dealId,
  });

  const statuses = await client.call<BitrixStatus[]>("crm.status.list", {
    filter: { ENTITY_ID: "DEAL_STAGE" },
  });

  const stages: DealStageSnapshot[] = statuses.map((item) => ({
    statusId: String(item.STATUS_ID ?? ""),
    name: String(item.NAME ?? ""),
    sort: Number(item.SORT ?? 0),
    semantics: String(item.SEMANTICS ?? ""),
  }));

  const actualTotalGross = parsePositiveMoney(
    deal.OPPORTUNITY ?? deal.opportunity,
    dealId
  );
  const currency = String(deal.CURRENCY_ID ?? deal.currencyId ?? "PLN");
  const actualStageId = String(deal.STAGE_ID ?? deal.stageId ?? "");
  const actualContractDate = deal[PAYMENT_SCHEDULE_FIELDS.contractDate];

  const stageId = simulateStage
    ? resolveStageIdByName(stages, simulateStage)
    : actualStageId;

  const totalGross =
    simulateTotalRaw !== undefined
      ? parsePositiveMoney(simulateTotalRaw, dealId)
      : actualTotalGross;

  const contractDate =
    simulateContractDate !== undefined
      ? normalizeSimulatedContractDate(simulateContractDate)
      : actualContractDate;

  const decision = evaluatePaymentScheduleSync({
    dealId,
    totalGross,
    currency,
    stageId,
    contractDate,
    advancePercent: deal[PAYMENT_SCHEDULE_FIELDS.advancePercent],
    advanceAmount: deal[PAYMENT_SCHEDULE_FIELDS.advanceAmount],
    stage2Amount: deal[PAYMENT_SCHEDULE_FIELDS.stage2Amount],
    stage3Amount: deal[PAYMENT_SCHEDULE_FIELDS.stage3Amount],
    stages,
  });

  const simulation = {
    active:
      simulateStage !== undefined ||
      simulateTotalRaw !== undefined ||
      simulateContractDate !== undefined,
    stage: simulateStage ?? null,
    totalGross: simulateTotalRaw ?? null,
    contractDate: simulateContractDate ?? null,
  };

  const result = {
    generatedAt: new Date().toISOString(),
    portalHost: client.portalHost,
    mode: apply ? "apply" : "dry-run",
    simulation,
    actual: {
      stageId: actualStageId,
      totalGross: actualTotalGross,
      contractDate: actualContractDate ?? null,
    },
    ...decision,
  };

  writeJson(path.join(env.reportDir, REPORT_FILE), result);

  printDecision(decision, simulation);

  if (!apply) {
    console.log();
    console.log("TRYB DRY-RUN — nic nie zapisano w Bitrix24.");
    console.log(`Raport: ${path.join(env.reportDir, REPORT_FILE)}`);
    return;
  }

  if (confirm !== APPLY_CONFIRM_VALUE) {
    throw new Error(
      `Tryb --apply wymaga potwierdzenia --confirm=${APPLY_CONFIRM_VALUE}`
    );
  }

  if (decision.action !== "needs_update") {
    console.log();
    console.log(`Brak zapisu. Decyzja: ${decision.action}.`);
    return;
  }

  await client.call("crm.deal.update", {
    id: dealId,
    fields: decision.fieldsToUpdate,
  });

  console.log();
  console.log(`Harmonogram 30/50/20 zaktualizowano w Dealu #${dealId}.`);
  console.log(
    "Pole „Pozostało do zapłaty” NIE zostało zmienione przez ten mechanizm."
  );
}

function printDecision(
  decision: ReturnType<typeof evaluatePaymentScheduleSync>,
  simulation: {
    active: boolean;
    stage: string | null;
    totalGross: string | null;
    contractDate: string | null;
  }
): void {
  console.log("MoonGlass — synchronizacja harmonogramu 30 / 50 / 20");
  console.log(`Deal: #${decision.dealId}`);

  if (simulation.active) {
    console.log("TRYB SYMULACJI: TAK");
    if (simulation.stage !== null) {
      console.log(`- symulowany etap: ${simulation.stage}`);
    }
    if (simulation.totalGross !== null) {
      console.log(`- symulowana kwota brutto: ${simulation.totalGross}`);
    }
    if (simulation.contractDate !== null) {
      console.log(
        `- symulowana data umowy: ${
          simulation.contractDate === ""
            ? "[PUSTA]"
            : simulation.contractDate
        }`
      );
    }
  }

  console.log(
    `Etap: ${decision.stage.name} (${decision.stage.statusId}, sort ${decision.stage.sort})`
  );
  console.log(
    `Etap startowy: ${decision.triggerStage.name} (sort ${decision.triggerStage.sort})`
  );
  console.log(
    `Data zawarcia umowy / zamrożenie: ${decision.frozen ? "TAK" : "NIE"}`
  );
  console.log(
    `Kwota brutto: ${decision.totalGross.toFixed(2)} ${decision.currency}`
  );
  console.log();
  console.log("Oczekiwany harmonogram:");
  console.log(
    `- I rata 30%:   ${decision.expected.advanceAmount.toFixed(2)} ${decision.currency}`
  );
  console.log(
    `- II rata 50%:  ${decision.expected.stage2Amount.toFixed(2)} ${decision.currency}`
  );
  console.log(
    `- III rata 20%: ${decision.expected.stage3Amount.toFixed(2)} ${decision.currency}`
  );
  console.log();
  console.log(`Decyzja: ${decision.action}`);

  if (decision.action === "before_trigger_stage") {
    console.log(
      "Deal nie doszedł jeszcze do etapu płatności — harmonogram nie jest aktualizowany."
    );
  } else if (decision.action === "frozen_by_contract_date") {
    console.log(
      "Data zawarcia umowy jest ustawiona — harmonogram jest zamrożony."
    );
  } else if (decision.action === "closed_stage") {
    console.log(
      "Deal jest na etapie wygranym/przegranym — automatyczna aktualizacja jest wyłączona."
    );
  } else if (decision.action === "up_to_date") {
    console.log("Kwoty w Bitrix24 są już zgodne z aktualnym brutto.");
  } else if (decision.action === "needs_update") {
    console.log("Kwoty wymagają aktualizacji.");
    console.log("Pola, które zostałyby zapisane:");
    for (const [key, value] of Object.entries(decision.fieldsToUpdate)) {
      console.log(`- ${key}: ${String(value)}`);
    }
  }
}

function resolveStageIdByName(
  stages: DealStageSnapshot[],
  stageName: string
): string {
  const normalized = stageName.trim().toLocaleLowerCase("pl-PL");
  const matches = stages.filter(
    (item) => item.name.trim().toLocaleLowerCase("pl-PL") === normalized
  );

  if (matches.length === 0) {
    throw new Error(`Nie znaleziono etapu o nazwie „${stageName}”.`);
  }
  if (matches.length > 1) {
    throw new Error(`Nazwa etapu „${stageName}” nie jest jednoznaczna.`);
  }
  return matches[0].statusId;
}

function normalizeSimulatedContractDate(value: string): string | undefined {
  const normalized = value.trim();
  if (
    normalized === "" ||
    normalized.toLowerCase() === "empty" ||
    normalized.toLowerCase() === "null"
  ) {
    return undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(
      "--simulate-contract-date musi mieć format RRRR-MM-DD albo wartość empty."
    );
  }

  return normalized;
}

function parsePositiveMoney(value: unknown, dealId: number): number {
  const parsed = Number(
    String(value ?? "").replace(/\s/g, "").replace(",", ".")
  );
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Deal #${dealId} nie ma prawidłowej dodatniej wartości OPPORTUNITY: ${String(value)}`
    );
  }
  return parsed;
}

function readPositiveIntegerArgument(name: string): number {
  const value = readArgument(name);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} musi być dodatnią liczbą całkowitą.`);
  }
  return parsed;
}

function readArgument(name: string): string | undefined {
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
