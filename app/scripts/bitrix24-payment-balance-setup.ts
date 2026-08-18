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
} from "./bitrix24/types";

const CONFIRM_VALUE = "MOONGLASS-PAYMENT-BALANCE-SETUP";
const REPORT_NAME = "payment-balance-setup.json";

const BALANCE_FIELD: UserFieldBlueprint = {
  entity: "deal",
  alias: "MG_OUTSTANDING_BALANCE",
  label: "Saldo do zapłaty",
  type: "double",
  sort: 1340,
  settings: { PRECISION: 2 },
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
        `PLAN: utworzyć pole „${BALANCE_FIELD.label}” (${getUserFieldName(BALANCE_FIELD)}) typu number (double).`
      );
    } else if (audit.status === "ready") {
      console.log("PLAN: brak zmian — pole już istnieje.");
    } else {
      console.log(
        `PLAN: konflikt typu — oczekiwano double, jest ${audit.actualType}. Nic nie zapisuj.`
      );
    }
    console.log(
      "Pole będzie przechowywać faktyczne saldo: Kwota deala - Wpłacona kwota."
    );
    console.log(
      "Istniejącego pola „Pozostało do zapłaty” nie zmieniamy — obecny kod używa go jako 70% pozostającego po I racie."
    );
    return;
  }

  if (readArgument("--confirm") !== CONFIRM_VALUE) {
    throw new Error(
      `Tryb apply wymaga: --confirm=${CONFIRM_VALUE}`
    );
  }

  if (audit.status === "incompatible") {
    throw new Error(
      `Istniejące pole ${audit.fieldName} ma niezgodny typ ${audit.actualType}. Nic nie zapisano.`
    );
  }

  if (audit.status === "ready") {
    console.log("Pole Saldo do zapłaty już istnieje — brak zmian.");
    return;
  }

  const result = await client.call<{ field?: BitrixUserField }>(
    "userfieldconfig.add",
    {
      moduleId: "crm",
      field: createUserFieldPayload(BALANCE_FIELD),
    }
  );

  if (!result.field) {
    throw new Error("Bitrix24 nie zwrócił utworzonego pola.");
  }

  const verify = await buildAudit(provisioner);
  writeJson(path.join(env.reportDir, "payment-balance-setup-verify.json"), verify);

  if (!verify.ok) {
    throw new Error("Pole utworzono, ale weryfikacja nie przeszła.");
  }

  console.log("MoonGlass — pole „Saldo do zapłaty” utworzone.");
  console.log(`Kod: ${getUserFieldName(BALANCE_FIELD)}`);
  console.log("Typ: double (liczba, precyzja 2)");
  console.log("Weryfikacja: OK");
}

async function buildAudit(provisioner: Bitrix24Provisioner) {
  const portal = await provisioner.audit({
    checkMethods: false,
    strictCriticalReads: true,
  });

  const fieldName = getUserFieldName(BALANCE_FIELD);
  const xmlId = getUserFieldXmlId(BALANCE_FIELD);

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

  if (existing.userTypeId !== BALANCE_FIELD.type) {
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
    multiple: "N",
    mandatory: "N",
    showFilter: "E",
    editInList: "Y",
    isSearchable: "N",
    ...(field.settings ? { settings: field.settings } : {}),
    editFormLabel: {
      pl: field.label,
      en: field.label,
    },
  };
}

function printAudit(audit: Awaited<ReturnType<typeof buildAudit>>) {
  console.log("MoonGlass — audyt pola salda płatności");
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
