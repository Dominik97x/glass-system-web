import path from "node:path";
import {
  PAYMENT_SCHEDULE_USER_FIELDS,
  getEntityId,
  getUserFieldName,
  getUserFieldXmlId,
} from "./bitrix24/blueprint";
import { ProvisionerBitrixClient } from "./bitrix24/client";
import { loadProvisionerEnv } from "./bitrix24/env";
import { writeJson, writeText } from "./bitrix24/io";
import { Bitrix24Provisioner } from "./bitrix24/provisioner";
import type {
  BitrixUserField,
  PlanAction,
  UserFieldBlueprint,
} from "./bitrix24/types";
import {
  calculatePaymentSchedule305020,
  formatBitrixMoney,
  PAYMENT_SCHEDULE_305020,
} from "../src/lib/payment-schedule";

const APPLY_CONFIRM_VALUE = "MOONGLASS-PAYMENT-SCHEDULE";
const DEAL_CONFIRM_VALUE = "MOONGLASS-PAYMENT-SCHEDULE-DEAL";
const AUDIT_FILE = "payment-schedule-audit.json";
const PLAN_FILE = "payment-schedule-plan.json";
const PLAN_MD_FILE = "payment-schedule-plan.md";
const VERIFY_FILE = "payment-schedule-verify.json";
const VERIFY_MD_FILE = "payment-schedule-verify.md";
const SET_FILE = "payment-schedule-set.json";

const EXISTING_PAYMENT_FIELDS = {
  advancePercent: "UF_CRM_DEAL_MG_ADVANCE_PERCENT",
  advanceAmount: "UF_CRM_DEAL_MG_ADVANCE_AMOUNT",
  advanceDueDate: "UF_CRM_DEAL_MG_ADVANCE_DUE_DATE",
  remainingAmount: "UF_CRM_DEAL_MG_REMAINING_AMOUNT",
} as const;

interface FieldStatus {
  key: string;
  entity: UserFieldBlueprint["entity"];
  alias: string;
  label: string;
  fieldName: string;
  xmlId: string;
  expectedType: string;
  status: "missing" | "ready" | "incompatible";
  fieldId?: string | number;
  actualType?: string;
}

interface PaymentScheduleAudit {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  expectedCount: number;
  readyCount: number;
  missingCount: number;
  incompatibleCount: number;
  fields: FieldStatus[];
}

interface PaymentSchedulePlan {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  actions: PlanAction[];
}

interface PaymentScheduleVerify extends PaymentScheduleAudit {
  ok: boolean;
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const confirmValue = readArgument("--confirm");
  const env = loadProvisionerEnv();
  const provisioner = new Bitrix24Provisioner(process.cwd(), env);
  const client = new ProvisionerBitrixClient(
    env.webhookUrl,
    env.requestTimeoutMs,
    env.retryCount
  );

  if (command === "audit") {
    const audit = await buildAudit(provisioner);
    saveAudit(env.reportDir, audit);
    printAudit(audit);
    return;
  }

  if (command === "plan") {
    const audit = await buildAudit(provisioner);
    saveAudit(env.reportDir, audit);
    const plan = buildPlan(audit);
    savePlan(env.reportDir, plan);
    const changes = plan.actions.filter((item) => item.kind === "create").length;
    const warnings = plan.actions.filter((item) => item.kind === "warning").length;
    console.log("Plan D6.5.2 — harmonogram 30/50/20 gotowy.");
    console.log(`Zmiany: ${changes}, ostrzeżenia: ${warnings}`);
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "apply") {
    if (confirmValue !== APPLY_CONFIRM_VALUE) {
      throw new Error(
        `Tryb apply wymaga potwierdzenia: npm run bitrix:payments:305020:apply -- --confirm=${APPLY_CONFIRM_VALUE}`
      );
    }

    const before = await buildAudit(provisioner);
    saveAudit(env.reportDir, before);
    assertNoIncompatibleFields(before);

    let created = 0;
    for (const desired of PAYMENT_SCHEDULE_USER_FIELDS) {
      const status = before.fields.find(
        (item) => item.entity === desired.entity && item.alias === desired.alias
      );
      if (!status || status.status !== "missing") continue;

      const result = await client.call<{ field?: BitrixUserField }>(
        "userfieldconfig.add",
        {
          moduleId: "crm",
          field: createUserFieldPayload(desired),
        }
      );
      if (!result.field) {
        throw new Error(
          `Bitrix24 nie zwrócił utworzonego pola ${getUserFieldName(desired)}.`
        );
      }
      created += 1;
    }

    const verify = await buildVerify(provisioner);
    saveVerify(env.reportDir, verify);
    if (!verify.ok) {
      throw new Error(
        `D6.5.2 nie zostało zakończone: brakujące pola ${verify.missingCount}, konflikty ${verify.incompatibleCount}.`
      );
    }

    const baseVerify = await provisioner.verify();
    if (!baseVerify.ok) {
      throw new Error(
        `Pola harmonogramu utworzono, ale pełna weryfikacja wykryła ${baseVerify.remainingActions.length} działań.`
      );
    }

    console.log("Pola harmonogramu płatności D6.5.2 zostały zastosowane.");
    console.log(`Utworzono: ${created}, gotowe: ${verify.readyCount}/${verify.expectedCount}`);
    console.log(`Raporty i mapowanie: ${env.reportDir}`);
    return;
  }

  if (command === "verify") {
    const verify = await buildVerify(provisioner);
    saveVerify(env.reportDir, verify);
    console.log(verify.ok ? "Weryfikacja D6.5.2 OK." : "Weryfikacja D6.5.2 wykryła problemy.");
    console.log(
      `Pola: ${verify.readyCount}/${verify.expectedCount}, brakujące: ${verify.missingCount}, konflikty: ${verify.incompatibleCount}`
    );
    console.log(`Raport: ${env.reportDir}`);
    if (!verify.ok) process.exitCode = 2;
    return;
  }

  if (command === "set") {
    if (confirmValue !== DEAL_CONFIRM_VALUE) {
      throw new Error(
        `Tryb set wymaga potwierdzenia: npm run bitrix:payments:305020:set -- --deal-id=3 --confirm=${DEAL_CONFIRM_VALUE}`
      );
    }

    const dealId = readPositiveIntegerArgument("--deal-id");
    const dueDate = readArgument("--due-date");
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      throw new Error("--due-date musi mieć format RRRR-MM-DD, np. 2026-08-12.");
    }

    const verify = await buildVerify(provisioner);
    saveVerify(env.reportDir, verify);
    if (!verify.ok) {
      throw new Error("Najpierw zastosuj i zweryfikuj pola D6.5.2.");
    }

    const deal = await client.call<Record<string, unknown>>("crm.deal.get", {
      id: dealId,
    });
    const totalGross = parseMoney(deal.OPPORTUNITY ?? deal.opportunity);
    const currency = String(deal.CURRENCY_ID ?? deal.currencyId ?? "PLN");
    const schedule = calculatePaymentSchedule305020(totalGross);

    const fields: Record<string, unknown> = {
      [EXISTING_PAYMENT_FIELDS.advancePercent]:
        PAYMENT_SCHEDULE_305020.stage1Percent,
      [EXISTING_PAYMENT_FIELDS.advanceAmount]: formatBitrixMoney(
        schedule.stage1Amount,
        currency
      ),
      [EXISTING_PAYMENT_FIELDS.remainingAmount]: formatBitrixMoney(
        schedule.remainingAfterStage1,
        currency
      ),
      UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT: formatBitrixMoney(
        schedule.stage2Amount,
        currency
      ),
      UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT: formatBitrixMoney(
        schedule.stage3Amount,
        currency
      ),
    };
    if (dueDate) {
      fields[EXISTING_PAYMENT_FIELDS.advanceDueDate] = dueDate;
    }

    await client.call("crm.deal.update", { id: dealId, fields });

    const result = {
      generatedAt: new Date().toISOString(),
      portalHost: client.portalHost,
      dealId,
      currency,
      dueDate: dueDate ?? null,
      percentages: PAYMENT_SCHEDULE_305020,
      amounts: schedule,
    };
    writeJson(path.join(env.reportDir, SET_FILE), result);

    console.log(`Harmonogram 30/50/20 zapisano w Dealu #${dealId}.`);
    console.log(
      `I rata: ${schedule.stage1Amount.toFixed(2)} ${currency}, II rata: ${schedule.stage2Amount.toFixed(2)} ${currency}, III rata: ${schedule.stage3Amount.toFixed(2)} ${currency}`
    );
    console.log(`Raport: ${path.join(env.reportDir, SET_FILE)}`);
    return;
  }

  throw new Error("Nieznane polecenie. Dostępne: audit, plan, apply, verify, set.");
}

async function buildAudit(
  provisioner: Bitrix24Provisioner
): Promise<PaymentScheduleAudit> {
  const portal = await provisioner.audit({
    checkMethods: false,
    strictCriticalReads: true,
  });
  const fields = buildStatuses(portal.userFields);
  return {
    generatedAt: new Date().toISOString(),
    portalHost: portal.portalHost,
    blueprintVersion: "D6.5.2-2026-08-05",
    expectedCount: fields.length,
    readyCount: fields.filter((item) => item.status === "ready").length,
    missingCount: fields.filter((item) => item.status === "missing").length,
    incompatibleCount: fields.filter((item) => item.status === "incompatible").length,
    fields,
  };
}

async function buildVerify(
  provisioner: Bitrix24Provisioner
): Promise<PaymentScheduleVerify> {
  const audit = await buildAudit(provisioner);
  return {
    ...audit,
    ok: audit.missingCount === 0 && audit.incompatibleCount === 0,
  };
}

function buildStatuses(existingFields: BitrixUserField[]): FieldStatus[] {
  return PAYMENT_SCHEDULE_USER_FIELDS.map((desired) => {
    const fieldName = getUserFieldName(desired);
    const xmlId = getUserFieldXmlId(desired);
    const existing = existingFields.find(
      (item) => item.fieldName === fieldName || item.xmlId === xmlId
    );

    if (!existing) {
      return {
        key: `${desired.entity}.${desired.alias}`,
        entity: desired.entity,
        alias: desired.alias,
        label: desired.label,
        fieldName,
        xmlId,
        expectedType: desired.type,
        status: "missing",
      };
    }

    if (existing.userTypeId !== desired.type) {
      return {
        key: `${desired.entity}.${desired.alias}`,
        entity: desired.entity,
        alias: desired.alias,
        label: desired.label,
        fieldName,
        xmlId,
        expectedType: desired.type,
        status: "incompatible",
        fieldId: existing.id,
        actualType: existing.userTypeId,
      };
    }

    return {
      key: `${desired.entity}.${desired.alias}`,
      entity: desired.entity,
      alias: desired.alias,
      label: desired.label,
      fieldName,
      xmlId,
      expectedType: desired.type,
      status: "ready",
      fieldId: existing.id,
      actualType: existing.userTypeId,
    };
  });
}

function buildPlan(audit: PaymentScheduleAudit): PaymentSchedulePlan {
  const actions: PlanAction[] = audit.fields.map((field) => {
    if (field.status === "missing") {
      return {
        kind: "create",
        resource: "user_field",
        key: field.key,
        message: `Utworzyć pole „${field.label}” (${field.fieldName}).`,
        details: { entity: field.entity, type: field.expectedType },
      };
    }
    if (field.status === "incompatible") {
      return {
        kind: "warning",
        resource: "user_field",
        key: field.key,
        message: `Pole ${field.fieldName} ma typ ${field.actualType}, oczekiwano ${field.expectedType}.`,
        details: { fieldId: field.fieldId },
      };
    }
    return {
      kind: "reuse",
      resource: "user_field",
      key: field.key,
      message: `Pole „${field.label}” już istnieje.`,
      details: { fieldId: field.fieldId, fieldName: field.fieldName },
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    portalHost: audit.portalHost,
    blueprintVersion: audit.blueprintVersion,
    actions,
  };
}

function createUserFieldPayload(
  field: UserFieldBlueprint
): Record<string, unknown> {
  return {
    entityId: getEntityId(field.entity),
    fieldName: getUserFieldName(field),
    userTypeId: field.type,
    xmlId: getUserFieldXmlId(field),
    sort: field.sort,
    multiple: field.multiple ? "Y" : "N",
    mandatory: field.mandatory ? "Y" : "N",
    showFilter: field.showFilter === false ? "N" : "E",
    editInList: "Y",
    isSearchable: field.searchable ? "Y" : "N",
    editFormLabel: { pl: field.label, en: field.label },
    ...(field.settings ? { settings: field.settings } : {}),
  };
}

function assertNoIncompatibleFields(audit: PaymentScheduleAudit): void {
  const incompatible = audit.fields.filter((item) => item.status === "incompatible");
  if (incompatible.length === 0) return;
  throw new Error(
    `Wykryto ${incompatible.length} pól o niezgodnych typach: ${incompatible
      .map((item) => `${item.fieldName} (${item.actualType} → ${item.expectedType})`)
      .join(", ")}.`
  );
}

function saveAudit(reportDir: string, audit: PaymentScheduleAudit): void {
  writeJson(path.join(reportDir, AUDIT_FILE), audit);
}

function savePlan(reportDir: string, plan: PaymentSchedulePlan): void {
  writeJson(path.join(reportDir, PLAN_FILE), plan);
  const rows = plan.actions
    .map((item) => `| ${item.kind} | ${item.key} | ${escapeMarkdown(item.message)} |`)
    .join("\n");
  writeText(
    path.join(reportDir, PLAN_MD_FILE),
    `# D6.5.2 — plan harmonogramu 30/50/20\n\n- Portal: ${plan.portalHost}\n- Wygenerowano: ${plan.generatedAt}\n- Blueprint: ${plan.blueprintVersion}\n\n| Działanie | Klucz | Opis |\n|---|---|---|\n${rows}\n`
  );
}

function saveVerify(reportDir: string, verify: PaymentScheduleVerify): void {
  writeJson(path.join(reportDir, VERIFY_FILE), verify);
  const rows = verify.fields
    .map(
      (item) =>
        `| ${item.alias} | ${escapeMarkdown(item.label)} | ${item.expectedType} | ${item.status} |`
    )
    .join("\n");
  writeText(
    path.join(reportDir, VERIFY_MD_FILE),
    `# D6.5.2 — weryfikacja harmonogramu 30/50/20\n\n- Portal: ${verify.portalHost}\n- Wynik: ${verify.ok ? "OK" : "WYMAGA UWAGI"}\n- Gotowe: ${verify.readyCount}/${verify.expectedCount}\n- Brakujące: ${verify.missingCount}\n- Konflikty: ${verify.incompatibleCount}\n\n| Alias | Etykieta | Typ | Status |\n|---|---|---|---|\n${rows}\n`
  );
}

function printAudit(audit: PaymentScheduleAudit): void {
  console.log("Audyt D6.5.2 — harmonogram 30/50/20 zakończony.");
  console.log(`Portal: ${audit.portalHost}`);
  console.log(
    `Pola: ${audit.readyCount}/${audit.expectedCount}, brakujące: ${audit.missingCount}, konflikty: ${audit.incompatibleCount}`
  );
}

function parseMoney(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Deal nie ma prawidłowej dodatniej wartości OPPORTUNITY: ${String(value)}`);
  }
  return parsed;
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
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
