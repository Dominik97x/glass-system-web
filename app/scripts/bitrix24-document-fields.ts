import path from "node:path";
import {
  DOCUMENT_USER_FIELDS,
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

const CONFIRM_VALUE = "MOONGLASS-DOCUMENT-FIELDS";
const AUDIT_FILE = "document-fields-audit.json";
const PLAN_FILE = "document-fields-plan.json";
const PLAN_MD_FILE = "document-fields-plan.md";
const VERIFY_FILE = "document-fields-verify.json";
const VERIFY_MD_FILE = "document-fields-verify.md";

interface DocumentFieldStatus {
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

interface DocumentFieldsAudit {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  expectedCount: number;
  readyCount: number;
  missingCount: number;
  incompatibleCount: number;
  fields: DocumentFieldStatus[];
}

interface DocumentFieldsPlan {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  actions: PlanAction[];
}

interface DocumentFieldsVerify {
  generatedAt: string;
  portalHost: string;
  ok: boolean;
  expectedCount: number;
  readyCount: number;
  missingCount: number;
  incompatibleCount: number;
  fields: DocumentFieldStatus[];
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
    const changes = plan.actions.filter(
      (item) => item.kind === "create" || item.kind === "update"
    ).length;
    const warnings = plan.actions.filter((item) => item.kind === "warning").length;
    console.log("Plan pól dokumentowych D6.2 gotowy.");
    console.log(`Zmiany: ${changes}, ostrzeżenia: ${warnings}`);
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "apply") {
    if (confirmValue !== CONFIRM_VALUE) {
      throw new Error(
        `Tryb apply wymaga jawnego potwierdzenia: npm run bitrix:documents:fields:apply -- --confirm=${CONFIRM_VALUE}`
      );
    }

    const before = await buildAudit(provisioner);
    saveAudit(env.reportDir, before);
    assertNoIncompatibleFields(before);

    let created = 0;
    for (const desired of DOCUMENT_USER_FIELDS) {
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
        `D6.2 nie zostało zakończone: brakujące pola ${verify.missingCount}, konflikty typów ${verify.incompatibleCount}.`
      );
    }

    // Odświeża pełne mapowanie UF_CRM_* wykorzystywane przez kolejne etapy.
    const baseVerify = await provisioner.verify();
    if (!baseVerify.ok) {
      throw new Error(
        `Pola dokumentowe utworzono, ale pełna weryfikacja portalu wykryła ${baseVerify.remainingActions.length} działań.`
      );
    }

    console.log("Pola dokumentowe D6.2 zostały zastosowane.");
    console.log(`Utworzono: ${created}, gotowe łącznie: ${verify.readyCount}/${verify.expectedCount}`);
    console.log(`Mapowanie i raporty: ${env.reportDir}`);
    return;
  }

  if (command === "verify") {
    const verify = await buildVerify(provisioner);
    saveVerify(env.reportDir, verify);

    if (verify.ok) {
      const baseVerify = await provisioner.verify();
      if (!baseVerify.ok) {
        console.log("Pola D6.2 są kompletne, ale pełna konfiguracja portalu wymaga uwagi.");
        console.log(`Pozostałe działania bazowe: ${baseVerify.remainingActions.length}`);
        console.log(`Raport: ${env.reportDir}`);
        process.exitCode = 2;
        return;
      }
    }

    console.log(verify.ok ? "Weryfikacja D6.2 OK." : "Weryfikacja D6.2 wykryła problemy.");
    console.log(
      `Pola: ${verify.readyCount}/${verify.expectedCount}, brakujące: ${verify.missingCount}, konflikty: ${verify.incompatibleCount}`
    );
    console.log(`Raport: ${env.reportDir}`);
    if (!verify.ok) process.exitCode = 2;
    return;
  }

  throw new Error(
    "Nieznane polecenie. Dostępne: audit, plan, apply, verify."
  );
}

async function buildAudit(
  provisioner: Bitrix24Provisioner
): Promise<DocumentFieldsAudit> {
  const portal = await provisioner.audit({
    checkMethods: false,
    strictCriticalReads: true,
  });
  const fields = buildStatuses(portal.userFields);
  return {
    generatedAt: new Date().toISOString(),
    portalHost: portal.portalHost,
    blueprintVersion: "D6.2-2026-08-05",
    expectedCount: fields.length,
    readyCount: fields.filter((item) => item.status === "ready").length,
    missingCount: fields.filter((item) => item.status === "missing").length,
    incompatibleCount: fields.filter((item) => item.status === "incompatible").length,
    fields,
  };
}

async function buildVerify(
  provisioner: Bitrix24Provisioner
): Promise<DocumentFieldsVerify> {
  const audit = await buildAudit(provisioner);
  return {
    generatedAt: audit.generatedAt,
    portalHost: audit.portalHost,
    ok: audit.missingCount === 0 && audit.incompatibleCount === 0,
    expectedCount: audit.expectedCount,
    readyCount: audit.readyCount,
    missingCount: audit.missingCount,
    incompatibleCount: audit.incompatibleCount,
    fields: audit.fields,
  };
}

function buildStatuses(existingFields: BitrixUserField[]): DocumentFieldStatus[] {
  return DOCUMENT_USER_FIELDS.map((desired) => {
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

function buildPlan(audit: DocumentFieldsAudit): DocumentFieldsPlan {
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

function assertNoIncompatibleFields(audit: DocumentFieldsAudit): void {
  const incompatible = audit.fields.filter(
    (item) => item.status === "incompatible"
  );
  if (incompatible.length === 0) return;
  throw new Error(
    `Wykryto ${incompatible.length} pól o niezgodnych typach: ${incompatible
      .map((item) => `${item.fieldName} (${item.actualType} → ${item.expectedType})`)
      .join(", ")}. Skrypt nie zmienia typów istniejących pól.`
  );
}

function saveAudit(reportDir: string, audit: DocumentFieldsAudit): void {
  writeJson(path.join(reportDir, AUDIT_FILE), audit);
}

function savePlan(reportDir: string, plan: DocumentFieldsPlan): void {
  writeJson(path.join(reportDir, PLAN_FILE), plan);
  writeText(path.join(reportDir, PLAN_MD_FILE), renderPlanMarkdown(plan));
}

function saveVerify(reportDir: string, verify: DocumentFieldsVerify): void {
  writeJson(path.join(reportDir, VERIFY_FILE), verify);
  writeText(path.join(reportDir, VERIFY_MD_FILE), renderVerifyMarkdown(verify));
}

function printAudit(audit: DocumentFieldsAudit): void {
  console.log("Audyt pól dokumentowych D6.2 zakończony.");
  console.log(`Portal: ${audit.portalHost}`);
  console.log(
    `Pola: ${audit.readyCount}/${audit.expectedCount}, brakujące: ${audit.missingCount}, konflikty: ${audit.incompatibleCount}`
  );
}

function renderPlanMarkdown(plan: DocumentFieldsPlan): string {
  const rows = plan.actions
    .map(
      (item) =>
        `| ${item.kind} | ${item.key} | ${escapeMarkdown(item.message)} |`
    )
    .join("\n");
  return `# D6.2 — plan pól dokumentowych\n\n- Portal: ${plan.portalHost}\n- Wygenerowano: ${plan.generatedAt}\n- Blueprint: ${plan.blueprintVersion}\n\n| Działanie | Klucz | Opis |\n|---|---|---|\n${rows}\n`;
}

function renderVerifyMarkdown(verify: DocumentFieldsVerify): string {
  const rows = verify.fields
    .map(
      (item) =>
        `| ${item.entity} | ${item.alias} | ${escapeMarkdown(item.label)} | ${item.expectedType} | ${item.status} |`
    )
    .join("\n");
  return `# D6.2 — weryfikacja pól dokumentowych\n\n- Portal: ${verify.portalHost}\n- Wynik: ${verify.ok ? "OK" : "WYMAGA UWAGI"}\n- Gotowe: ${verify.readyCount}/${verify.expectedCount}\n- Brakujące: ${verify.missingCount}\n- Konflikty: ${verify.incompatibleCount}\n\n| Encja | Alias | Etykieta | Typ | Status |\n|---|---|---|---|---|\n${rows}\n`;
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
