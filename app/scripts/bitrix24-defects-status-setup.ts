import path from "node:path";
import { ProvisionerBitrixClient } from "./bitrix24/client";
import { loadProvisionerEnv } from "./bitrix24/env";
import { writeJson } from "./bitrix24/io";
import { Bitrix24Provisioner } from "./bitrix24/provisioner";
import {
  getEntityId,
  getUserFieldName,
  getUserFieldXmlId,
} from "./bitrix24/blueprint";
import type {
  BitrixUserField,
  UserFieldBlueprint,
  EnumValueBlueprint,
} from "./bitrix24/types";

const CONFIRM_VALUE = "MOONGLASS-DEFECTS-STATUS-SETUP";
const REPORT_NAME = "defects-status-setup.json";

function enumValues(values: string[]): EnumValueBlueprint[] {
  return values.map((value, index) => ({
    xmlId: value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .toUpperCase(),
    value,
    sort: (index + 1) * 100,
  }));
}

const DEFECTS_STATUS_FIELD: UserFieldBlueprint = {
  entity: "deal",
  alias: "MG_ACCEPTANCE_DEFECTS_STATUS",
  label: "Status usunięcia usterek",
  type: "enumeration",
  sort: 1295,
  enumValues: enumValues([
    "Nie dotyczy",
    "Do usunięcia",
    "W trakcie",
    "Usunięte",
  ]),
};

async function main(): Promise<void> {
  const command = (process.argv[2] || "audit").toLowerCase();
  const env = loadProvisionerEnv();
  const provisioner = new Bitrix24Provisioner(process.cwd(), env);
  const client = new ProvisionerBitrixClient(
    env.webhookUrl,
    env.requestTimeoutMs,
    env.retryCount
  );

  if (!["audit", "plan", "apply", "verify"].includes(command)) {
    throw new Error("Dostępne polecenia: audit, plan, apply, verify.");
  }

  const audit = await buildAudit(provisioner);
  writeJson(path.join(env.reportDir, REPORT_NAME), audit);

  if (command === "audit" || command === "verify") {
    printAudit(audit);
    if (command === "verify" && !audit.ok) process.exitCode = 2;
    return;
  }

  if (command === "plan") {
    printAudit(audit);
    console.log();

    if (audit.status === "missing") {
      console.log(
        `PLAN: utworzyć pole „${DEFECTS_STATUS_FIELD.label}” (${getUserFieldName(
          DEFECTS_STATUS_FIELD
        )}) typu lista.`
      );
      console.log("Wartości:");
      for (const item of DEFECTS_STATUS_FIELD.enumValues || []) {
        console.log(`- ${item.value}`);
      }
    } else if (audit.status === "ready") {
      console.log("PLAN: brak zmian — pole już istnieje.");
    } else {
      console.log(
        `PLAN: konflikt typu — oczekiwano enumeration, jest ${audit.actualType}. Nic nie zapisuj.`
      );
    }

    console.log();
    console.log(
      "Skrypt tworzy tylko pole. Nie zmienia układu karty ani automatyzacji Bitrix24."
    );
    return;
  }

  if (readArgument("--confirm") !== CONFIRM_VALUE) {
    throw new Error(`Tryb apply wymaga: --confirm=${CONFIRM_VALUE}`);
  }

  if (audit.status === "incompatible") {
    throw new Error(
      `Istniejące pole ${audit.fieldName} ma niezgodny typ ${audit.actualType}. Nic nie zapisano.`
    );
  }

  if (audit.status === "ready") {
    console.log("Pole „Status usunięcia usterek” już istnieje — brak zmian.");
    return;
  }

  const result = await client.call<{ field?: BitrixUserField }>(
    "userfieldconfig.add",
    {
      moduleId: "crm",
      field: createUserFieldPayload(DEFECTS_STATUS_FIELD),
    }
  );

  if (!result.field) {
    throw new Error("Bitrix24 nie zwrócił utworzonego pola.");
  }

  const verify = await buildAudit(provisioner);
  writeJson(
    path.join(env.reportDir, "defects-status-setup-verify.json"),
    verify
  );

  if (!verify.ok) {
    throw new Error("Pole utworzono, ale weryfikacja nie przeszła.");
  }

  console.log("MoonGlass — pole „Status usunięcia usterek” utworzone.");
  console.log(`Kod: ${getUserFieldName(DEFECTS_STATUS_FIELD)}`);
  console.log("Typ: lista (enumeration)");
  console.log("Weryfikacja: OK");
}

async function buildAudit(provisioner: Bitrix24Provisioner) {
  const portal = await provisioner.audit({
    checkMethods: false,
    strictCriticalReads: true,
  });

  const fieldName = getUserFieldName(DEFECTS_STATUS_FIELD);
  const xmlId = getUserFieldXmlId(DEFECTS_STATUS_FIELD);

  const existing = portal.userFields.find(
    (item) => item.fieldName === fieldName || item.xmlId === xmlId
  );

  if (!existing) {
    return {
      generatedAt: new Date().toISOString(),
      fieldName,
      xmlId,
      status: "missing" as const,
      actualType: null,
      ok: false,
    };
  }

  if (existing.userTypeId !== DEFECTS_STATUS_FIELD.type) {
    return {
      generatedAt: new Date().toISOString(),
      fieldName,
      xmlId,
      status: "incompatible" as const,
      actualType: existing.userTypeId,
      ok: false,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    fieldName,
    xmlId,
    status: "ready" as const,
    actualType: existing.userTypeId,
    ok: true,
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
    mandatory: "N",
    showFilter: field.showFilter === false ? "N" : "E",
    editInList: "Y",
    isSearchable: field.searchable ? "Y" : "N",
    editFormLabel: {
      pl: field.label,
      en: field.label,
    },
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

function printAudit(audit: Awaited<ReturnType<typeof buildAudit>>): void {
  console.log("MoonGlass — audyt statusu usunięcia usterek");
  console.log(`Pole: ${audit.fieldName}`);
  console.log(`Status: ${audit.status}`);
  if (audit.actualType) console.log(`Typ: ${audit.actualType}`);
  console.log(`Wynik: ${audit.ok ? "OK" : "WYMAGA ZMIANY"}`);
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
