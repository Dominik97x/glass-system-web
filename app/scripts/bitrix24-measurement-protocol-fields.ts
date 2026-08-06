import path from "node:path";
import {
  MEASUREMENT_PROTOCOL_USER_FIELDS,
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

const CONFIRM_VALUE = "MOONGLASS-MEASUREMENT-PROTOCOL-FIELDS";
const AUDIT_FILE = "measurement-protocol-fields-audit.json";
const PLAN_FILE = "measurement-protocol-fields-plan.json";
const PLAN_MD_FILE = "measurement-protocol-fields-plan.md";
const VERIFY_FILE = "measurement-protocol-fields-verify.json";
const VERIFY_MD_FILE = "measurement-protocol-fields-verify.md";

interface MeasurementFieldStatus {
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

interface MeasurementFieldsAudit {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  expectedCount: number;
  readyCount: number;
  missingCount: number;
  incompatibleCount: number;
  fields: MeasurementFieldStatus[];
}

interface MeasurementFieldsPlan {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  actions: PlanAction[];
}

interface MeasurementFieldsVerify extends MeasurementFieldsAudit {
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
    console.log("Plan D6.7.1 — pola protokołu pomiaru gotowy.");
    console.log(`Zmiany: ${changes}, ostrzeżenia: ${warnings}`);
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "apply") {
    if (confirmValue !== CONFIRM_VALUE) {
      throw new Error(
        `Tryb apply wymaga potwierdzenia: npm run bitrix:measurement:protocol:apply -- --confirm=${CONFIRM_VALUE}`
      );
    }

    const before = await buildAudit(provisioner);
    saveAudit(env.reportDir, before);
    assertNoIncompatibleFields(before);

    let created = 0;
    for (const desired of MEASUREMENT_PROTOCOL_USER_FIELDS) {
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
        `D6.7.1 nie zostało zakończone: brakujące pola ${verify.missingCount}, konflikty ${verify.incompatibleCount}.`
      );
    }

    const baseVerify = await provisioner.verify();
    if (!baseVerify.ok) {
      throw new Error(
        `Pola protokołu pomiaru utworzono, ale pełna weryfikacja wykryła ${baseVerify.remainingActions.length} działań.`
      );
    }

    console.log("Pola protokołu pomiaru D6.7.1 zostały zastosowane.");
    console.log(`Utworzono: ${created}, gotowe: ${verify.readyCount}/${verify.expectedCount}`);
    console.log(`Raporty i mapowanie: ${env.reportDir}`);
    return;
  }

  if (command === "verify") {
    const verify = await buildVerify(provisioner);
    saveVerify(env.reportDir, verify);
    console.log(
      verify.ok
        ? "Weryfikacja D6.7.1 OK."
        : "Weryfikacja D6.7.1 wykryła problemy."
    );
    console.log(
      `Pola: ${verify.readyCount}/${verify.expectedCount}, brakujące: ${verify.missingCount}, konflikty: ${verify.incompatibleCount}`
    );
    console.log(`Raport: ${env.reportDir}`);
    if (!verify.ok) process.exitCode = 2;
    return;
  }

  throw new Error("Nieznane polecenie. Dostępne: audit, plan, apply, verify.");
}

async function buildAudit(
  provisioner: Bitrix24Provisioner
): Promise<MeasurementFieldsAudit> {
  const portal = await provisioner.audit({
    checkMethods: false,
    strictCriticalReads: true,
  });
  const fields = buildStatuses(portal.userFields);
  return {
    generatedAt: new Date().toISOString(),
    portalHost: portal.portalHost,
    blueprintVersion: "D6.7.1-2026-08-05",
    expectedCount: fields.length,
    readyCount: fields.filter((item) => item.status === "ready").length,
    missingCount: fields.filter((item) => item.status === "missing").length,
    incompatibleCount: fields.filter((item) => item.status === "incompatible").length,
    fields,
  };
}

async function buildVerify(
  provisioner: Bitrix24Provisioner
): Promise<MeasurementFieldsVerify> {
  const audit = await buildAudit(provisioner);
  return {
    ...audit,
    ok: audit.missingCount === 0 && audit.incompatibleCount === 0,
  };
}

function buildStatuses(existingFields: BitrixUserField[]): MeasurementFieldStatus[] {
  return MEASUREMENT_PROTOCOL_USER_FIELDS.map((desired) => {
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

function buildPlan(audit: MeasurementFieldsAudit): MeasurementFieldsPlan {
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
    ...(field.enumValues
      ? {
          enum: field.enumValues.map((item) => ({
            xmlId: item.xmlId,
            value: item.value,
            sort: item.sort,
            def: item.default ? "Y" : "N",
          })),
        }
      : {}),
  };
}

function assertNoIncompatibleFields(audit: MeasurementFieldsAudit): void {
  const incompatible = audit.fields.filter((item) => item.status === "incompatible");
  if (incompatible.length === 0) return;
  throw new Error(
    `Wykryto ${incompatible.length} pól o niezgodnych typach: ${incompatible
      .map((item) => `${item.fieldName} (${item.actualType} → ${item.expectedType})`)
      .join(", ")}.`
  );
}

function saveAudit(reportDir: string, audit: MeasurementFieldsAudit): void {
  writeJson(path.join(reportDir, AUDIT_FILE), audit);
}

function savePlan(reportDir: string, plan: MeasurementFieldsPlan): void {
  writeJson(path.join(reportDir, PLAN_FILE), plan);
  const rows = plan.actions
    .map((item) => `| ${item.kind} | ${item.key} | ${escapeMarkdown(item.message)} |`)
    .join("\n");
  writeText(
    path.join(reportDir, PLAN_MD_FILE),
    `# D6.7.1 — plan pól protokołu pomiaru\n\n- Portal: ${plan.portalHost}\n- Wygenerowano: ${plan.generatedAt}\n- Blueprint: ${plan.blueprintVersion}\n\n| Działanie | Klucz | Opis |\n|---|---|---|\n${rows}\n`
  );
}

function saveVerify(reportDir: string, verify: MeasurementFieldsVerify): void {
  writeJson(path.join(reportDir, VERIFY_FILE), verify);
  const rows = verify.fields
    .map(
      (item) =>
        `| ${item.alias} | ${escapeMarkdown(item.label)} | ${item.expectedType} | ${item.status} |`
    )
    .join("\n");
  writeText(
    path.join(reportDir, VERIFY_MD_FILE),
    `# D6.7.1 — weryfikacja pól protokołu pomiaru\n\n- Portal: ${verify.portalHost}\n- Wynik: ${verify.ok ? "OK" : "WYMAGA UWAGI"}\n- Gotowe: ${verify.readyCount}/${verify.expectedCount}\n- Brakujące: ${verify.missingCount}\n- Konflikty: ${verify.incompatibleCount}\n\n| Alias | Etykieta | Typ | Status |\n|---|---|---|---|\n${rows}\n`
  );
}

function printAudit(audit: MeasurementFieldsAudit): void {
  console.log("Audyt D6.7.1 — pola protokołu pomiaru zakończony.");
  console.log(`Portal: ${audit.portalHost}`);
  console.log(
    `Pola: ${audit.readyCount}/${audit.expectedCount}, brakujące: ${audit.missingCount}, konflikty: ${audit.incompatibleCount}`
  );
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
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
