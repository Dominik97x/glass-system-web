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
  EnumValueBlueprint,
  UserFieldBlueprint,
} from "./bitrix24/types";

const ENTITY_TYPE_ID = 2;
const DEAL_CATEGORY_ID = 0; // 01 Sprzedaż z pomiarem
const CONFIRM_VALUE = "MOONGLASS-ACCEPTANCE-PROTOCOL-SETUP";
const SECTION_NAME = "mg_acceptance";
const SECTION_TITLE = "08 — Odbiór / zakończenie realizacji";

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

function field(
  alias: string,
  label: string,
  type: UserFieldBlueprint["type"],
  sort: number,
  extra: Partial<UserFieldBlueprint> = {}
): UserFieldBlueprint {
  return { entity: "deal", alias, label, type, sort, ...extra };
}

const ACCEPTANCE_FIELDS: UserFieldBlueprint[] = [
  field(
    "MG_ACCEPTANCE_PROTOCOL_NUMBER",
    "Numer protokołu odbioru",
    "string",
    1240,
    { searchable: true }
  ),
  field(
    "MG_ACCEPTANCE_AT",
    "Data i godzina odbioru",
    "datetime",
    1250
  ),
  field(
    "MG_INSTALLATION_COMPLETED_DATE",
    "Data zakończenia montażu",
    "date",
    1260
  ),
  field(
    "MG_ACCEPTANCE_RESULT",
    "Wynik odbioru",
    "enumeration",
    1270,
    {
      enumValues: enumValues([
        "Odbiór bez uwag",
        "Odbiór z uwagami / usterkami",
        "Odbiór odmówiony",
      ]),
    }
  ),
  field(
    "MG_ACCEPTANCE_STATUS",
    "Status protokołu odbioru",
    "enumeration",
    1280,
    {
      enumValues: enumValues([
        "Roboczy",
        "Do podpisu",
        "Podpisany",
        "Wymaga uzupełnienia",
      ]),
    }
  ),
  field(
    "MG_ACCEPTANCE_DEFECTS_DUE_DATE",
    "Termin usunięcia usterek",
    "date",
    1290
  ),
  field(
    "MG_ACCEPTANCE_PHOTOS_STATUS",
    "Dokumentacja zdjęciowa odbioru",
    "enumeration",
    1300,
    {
      enumValues: enumValues([
        "Wykonana",
        "Nie wymagana",
        "Do uzupełnienia",
      ]),
    }
  ),
  field(
    "MG_HANDOVER_DOCUMENTS_STATUS",
    "Dokumenty / instrukcje przekazane klientowi",
    "enumeration",
    1310,
    {
      enumValues: enumValues(["Tak", "Częściowo", "Nie"]),
    }
  ),
  field(
    "MG_ACCEPTANCE_OWNER",
    "Osoba wykonująca odbiór",
    "employee",
    1320
  ),
  field(
    "MG_PAYMENT_STAGE3_DUE_DATE",
    "Termin płatności III raty",
    "date",
    1330
  ),
];

// To pole już istnieje w głównym blueprintcie MoonGlass.
// Używamy go ponownie zamiast tworzyć duplikat "Uwagi / usterki przy odbiorze".
const EXISTING_DEFECTS_FIELD = "UF_CRM_DEAL_MG_DEFECTS";

const SECTION_FIELD_NAMES = [
  ...ACCEPTANCE_FIELDS.map((item) => getUserFieldName(item)),
  EXISTING_DEFECTS_FIELD,
];

interface FieldStatus {
  alias: string;
  label: string;
  fieldName: string;
  expectedType: string;
  status: "missing" | "ready" | "incompatible";
  actualType?: string;
  fieldId?: string | number;
}

async function main(): Promise<void> {
  const command = process.argv[2] || "audit";
  const confirm = readArgument("--confirm");
  const env = loadProvisionerEnv();
  const client = new ProvisionerBitrixClient(
    env.webhookUrl,
    env.requestTimeoutMs,
    env.retryCount
  );
  const provisioner = new Bitrix24Provisioner(process.cwd(), env);

  if (!["audit", "plan", "apply", "verify"].includes(command)) {
    throw new Error("Dostępne polecenia: audit, plan, apply, verify.");
  }

  const before = await buildAudit(provisioner, client);
  writeJson(
    path.join(env.reportDir, "acceptance-protocol-setup-audit.json"),
    before
  );

  if (command === "audit" || command === "plan") {
    printAudit(before);

    if (command === "plan") {
      console.log();
      console.log("PLAN:");

      for (const item of before.fields) {
        if (item.status === "missing") {
          console.log(`- utworzyć pole: ${item.label} (${item.fieldName})`);
        } else if (item.status === "incompatible") {
          console.log(
            `- UWAGA: ${item.label} ma typ ${item.actualType}, oczekiwano ${item.expectedType}`
          );
        }
      }

      console.log(
        before.sectionReady
          ? `- sekcja „${SECTION_TITLE}” jest już kompletna`
          : `- utworzyć/uzupełnić sekcję „${SECTION_TITLE}”`
      );
      console.log(
        "- pole „Usterki / uwagi” zostanie użyte ponownie, bez tworzenia duplikatu"
      );
    }

    return;
  }

  if (command === "verify") {
    printAudit(before);
    if (!before.ok) process.exitCode = 2;
    return;
  }

  if (confirm !== CONFIRM_VALUE) {
    throw new Error(
      `Tryb apply wymaga: --confirm=${CONFIRM_VALUE}`
    );
  }

  const incompatible = before.fields.filter(
    (item) => item.status === "incompatible"
  );

  if (incompatible.length > 0) {
    throw new Error(
      `Wykryto ${incompatible.length} pól o niezgodnym typie. Nic nie zapisano.`
    );
  }

  let created = 0;

  for (const desired of ACCEPTANCE_FIELDS) {
    const status = before.fields.find(
      (item) => item.alias === desired.alias
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
        `Bitrix24 nie zwrócił utworzonego pola ${desired.label}.`
      );
    }

    created += 1;
  }

  const fieldsAfterCreate = await buildFieldStatuses(provisioner);
  const remainingProblems = fieldsAfterCreate.filter(
    (item) => item.status !== "ready"
  );

  if (remainingProblems.length > 0) {
    throw new Error(
      `Po tworzeniu pól nadal są problemy: ${remainingProblems
        .map((item) => `${item.fieldName}:${item.status}`)
        .join(", ")}. Układ karty nie został zmieniony.`
    );
  }

  const currentLayout = await getLayout(client);
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const backupPath = path.join(
    env.reportDir,
    `acceptance-protocol-card-before-${timestamp}.json`
  );

  writeJson(backupPath, currentLayout);

  const proposedLayout = upsertAcceptanceSection(currentLayout);

  await client.call("crm.item.details.configuration.set", {
    entityTypeId: ENTITY_TYPE_ID,
    scope: "C",
    data: proposedLayout,
    extras: { dealCategoryId: DEAL_CATEGORY_ID },
  });

  const verify = await buildAudit(provisioner, client);

  writeJson(
    path.join(env.reportDir, "acceptance-protocol-setup-verify.json"),
    verify
  );

  if (!verify.ok) {
    throw new Error(
      `Zapis wykonano, ale weryfikacja nie jest OK. Backup układu: ${backupPath}`
    );
  }

  console.log("MoonGlass — konfiguracja Protokołu Odbioru zakończona.");
  console.log(
    `Utworzono nowych pól: ${created}/${ACCEPTANCE_FIELDS.length}`
  );
  console.log(`Sekcja: ${SECTION_TITLE}`);
  console.log("Pole istniejące użyte ponownie: Usterki / uwagi");
  console.log(`Backup układu przed zmianą: ${backupPath}`);
}

async function buildAudit(
  provisioner: Bitrix24Provisioner,
  client: ProvisionerBitrixClient
) {
  const fields = await buildFieldStatuses(provisioner);
  const layout = await getLayout(client);

  const section = layout.find(
    (item) =>
      item.name === SECTION_NAME ||
      normalize(item.title) === normalize(SECTION_TITLE)
  );

  const actualSectionFields = (section?.elements || []).map(
    (item: any) => item.name
  );

  const sectionReady =
    Boolean(section) &&
    SECTION_FIELD_NAMES.every((fieldName) =>
      actualSectionFields.includes(fieldName)
    );

  const existingDefectsReady = await existingFieldExists(
    provisioner,
    EXISTING_DEFECTS_FIELD
  );

  const ok =
    fields.every((item) => item.status === "ready") &&
    existingDefectsReady &&
    sectionReady;

  return {
    generatedAt: new Date().toISOString(),
    fields,
    existingDefectsField: {
      fieldName: EXISTING_DEFECTS_FIELD,
      ready: existingDefectsReady,
    },
    section: {
      title: SECTION_TITLE,
      ready: sectionReady,
      actualFields: actualSectionFields,
      expectedFields: SECTION_FIELD_NAMES,
    },
    sectionReady,
    ok,
  };
}

async function buildFieldStatuses(
  provisioner: Bitrix24Provisioner
): Promise<FieldStatus[]> {
  const portal = await provisioner.audit({
    checkMethods: false,
    strictCriticalReads: true,
  });

  return ACCEPTANCE_FIELDS.map((desired) => {
    const fieldName = getUserFieldName(desired);
    const xmlId = getUserFieldXmlId(desired);

    const existing = portal.userFields.find(
      (item) =>
        item.fieldName === fieldName ||
        item.xmlId === xmlId
    );

    if (!existing) {
      return {
        alias: desired.alias,
        label: desired.label,
        fieldName,
        expectedType: desired.type,
        status: "missing" as const,
      };
    }

    if (existing.userTypeId !== desired.type) {
      return {
        alias: desired.alias,
        label: desired.label,
        fieldName,
        expectedType: desired.type,
        status: "incompatible" as const,
        actualType: existing.userTypeId,
        fieldId: existing.id,
      };
    }

    return {
      alias: desired.alias,
      label: desired.label,
      fieldName,
      expectedType: desired.type,
      status: "ready" as const,
      actualType: existing.userTypeId,
      fieldId: existing.id,
    };
  });
}

async function existingFieldExists(
  provisioner: Bitrix24Provisioner,
  fieldName: string
): Promise<boolean> {
  const portal = await provisioner.audit({
    checkMethods: false,
    strictCriticalReads: true,
  });

  return portal.userFields.some(
    (item) => item.fieldName === fieldName
  );
}

async function getLayout(
  client: ProvisionerBitrixClient
): Promise<any[]> {
  const result = await client.call<any[]>(
    "crm.item.details.configuration.get",
    {
      entityTypeId: ENTITY_TYPE_ID,
      scope: "C",
      extras: { dealCategoryId: DEAL_CATEGORY_ID },
    }
  );

  if (!Array.isArray(result)) {
    throw new Error(
      "Bitrix24 nie zwrócił wspólnej konfiguracji karty deala."
    );
  }

  return result;
}

function upsertAcceptanceSection(current: any[]): any[] {
  const currentElements = new Map<string, any>();

  for (const section of current) {
    for (const element of section.elements || []) {
      currentElements.set(element.name, element);
    }
  }

  const elementFor = (name: string) => {
    const existing = currentElements.get(name);
    return existing
      ? { ...existing }
      : { name, optionFlags: "0" };
  };

  const withoutTarget = current.filter(
    (item) =>
      item.name !== SECTION_NAME &&
      normalize(item.title) !== normalize(SECTION_TITLE)
  );

  const section = {
    name: SECTION_NAME,
    title: SECTION_TITLE,
    type: "section",
    elements: [
      elementFor("UF_CRM_DEAL_MG_ACCEPTANCE_PROTOCOL_NUMBER"),
      elementFor("UF_CRM_DEAL_MG_ACCEPTANCE_AT"),
      elementFor("UF_CRM_DEAL_MG_INSTALLATION_COMPLETED_DATE"),
      elementFor("UF_CRM_DEAL_MG_ACCEPTANCE_RESULT"),
      elementFor("UF_CRM_DEAL_MG_ACCEPTANCE_STATUS"),
      elementFor(EXISTING_DEFECTS_FIELD),
      elementFor("UF_CRM_DEAL_MG_ACCEPTANCE_DEFECTS_DUE_DATE"),
      elementFor("UF_CRM_DEAL_MG_ACCEPTANCE_PHOTOS_STATUS"),
      elementFor("UF_CRM_DEAL_MG_HANDOVER_DOCUMENTS_STATUS"),
      elementFor("UF_CRM_DEAL_MG_ACCEPTANCE_OWNER"),
      elementFor("UF_CRM_DEAL_MG_PAYMENT_STAGE3_DUE_DATE"),
    ],
  };

  const productsIndex = withoutTarget.findIndex(
    (item) => item.name === "products"
  );

  if (productsIndex >= 0) {
    return [
      ...withoutTarget.slice(0, productsIndex),
      section,
      ...withoutTarget.slice(productsIndex),
    ];
  }

  return [...withoutTarget, section];
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
    ...(field.settings
      ? { settings: field.settings }
      : {}),
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

function printAudit(
  audit: Awaited<ReturnType<typeof buildAudit>>
): void {
  console.log("MoonGlass — audyt Protokołu Odbioru");
  console.log(
    `Pola: ${
      audit.fields.filter((item) => item.status === "ready").length
    }/${audit.fields.length}`
  );
  console.log(
    `Brakujące: ${
      audit.fields.filter((item) => item.status === "missing").length
    }, konflikty: ${
      audit.fields.filter((item) => item.status === "incompatible").length
    }`
  );
  console.log(
    `Pole „Usterki / uwagi”: ${
      audit.existingDefectsField.ready ? "OK" : "BRAK"
    }`
  );
  console.log(
    `Sekcja 08: ${
      audit.sectionReady ? "OK" : "DO UZUPEŁNIENIA"
    }`
  );
  console.log(
    `Wynik: ${audit.ok ? "OK" : "WYMAGA ZMIAN"}`
  );
}

function normalize(value: unknown): string {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("pl-PL")
    .replace(/\s+/g, " ");
}

function readArgument(
  name: string
): string | undefined {
  const prefix = `${name}=`;
  const inline = process.argv.find(
    (value) => value.startsWith(prefix)
  );

  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  return index >= 0
    ? process.argv[index + 1]
    : undefined;
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : String(error)
  );
  process.exitCode = 1;
});
