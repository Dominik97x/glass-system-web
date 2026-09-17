import path from "node:path";
import { ProvisionerBitrixClient } from "./bitrix24/client";
import { loadProvisionerEnv } from "./bitrix24/env";
import { writeJson } from "./bitrix24/io";

const ENTITY_TYPE_ID = 2;
const DEAL_CATEGORY_ID = 0; // 01 Sprzedaż z pomiarem
const CONFIRM_VALUE = "MOONGLASS-FIX-SALES-CARD-LAYOUT";

type AnySection = {
  name?: string;
  title?: string;
  type?: string;
  elements?: Array<Record<string, any>>;
};

interface SectionSpec {
  name: string;
  title: string;
  fields: string[];
}

const SECTION_SPECS: SectionSpec[] = [
  {
    name: "mg_install_location",
    title: "02 — MIEJSCE MONTAŻU",
    fields: [
      "UF_CRM_DEAL_MG_INSTALL_ADDRESS",
      "UF_CRM_DEAL_MG_POSTAL_CODE",
      "UF_CRM_DEAL_MG_CITY",
      "UF_CRM_DEAL_MG_ACCESS_NOTES",
    ],
  },
  {
    name: "mg_offer",
    title: "03 — OFERTA",
    fields: [
      "UF_CRM_DEAL_MG_OFFER_NUMBER",
      "UF_CRM_DEAL_MG_OFFER_VALID_UNTIL",
      "UF_CRM_DEAL_MG_PLANNED_COMPLETION_DATE",
      "UF_CRM_DEAL_MG_PAYMENT_METHOD",
      "UF_CRM_DEAL_MG_CUSTOM_QUOTE",
      "UF_CRM_DEAL_MG_SITE_PREPARATION",
      "UF_CRM_DEAL_MG_CONSTRUCTION_COLOR",
      "UF_CRM_DEAL_MG_DOCUMENT_VAT_PERCENT",
      "UF_CRM_DEAL_MG_OFFER_NOTES",
      "UF_CRM_DEAL_MG_TECHNICAL_NOTES",
    ],
  },
  {
    name: "mg_payments",
    title: "04 — PŁATNOŚCI 30 / 50 / 20",
    fields: [
      "UF_CRM_DEAL_MG_ADVANCE_PERCENT",
      "UF_CRM_DEAL_MG_ADVANCE_AMOUNT",
      "UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT",
      "UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT",
      "UF_CRM_DEAL_MG_ADVANCE_DUE_DATE",
      "UF_CRM_DEAL_MG_PAID_AMOUNT",
      "UF_CRM_DEAL_MG_REMAINING_AMOUNT",
    ],
  },
  {
    name: "mg_measurement",
    title: "05 — POMIAR / TECHNICZNE",
    fields: [
      "UF_CRM_DEAL_MG_MEASUREMENT_AT",
      "UF_CRM_DEAL_MG_MEASUREMENT_OWNER",
      "UF_CRM_DEAL_MG_MEASUREMENT_PROTOCOL_NUMBER",
      "UF_CRM_DEAL_MG_MEASUREMENT_NOTES",
      "UF_CRM_DEAL_MG_MEASUREMENT_CLIENT_NOTES",
      "UF_CRM_DEAL_MG_MEASURED_WIDTH_CM",
      "UF_CRM_DEAL_MG_MEASURED_DEPTH_CM",
      "UF_CRM_DEAL_MG_MEASURED_HEIGHT_WALL_CM",
      "UF_CRM_DEAL_MG_MEASURED_HEIGHT_FRONT_CM",
      "UF_CRM_DEAL_MG_MEASUREMENT_GROUND_STATUS",
      "UF_CRM_DEAL_MG_MEASUREMENT_WALL_STATUS",
      "UF_CRM_DEAL_MG_MEASUREMENT_POWER_STATUS",
      "UF_CRM_DEAL_MG_MEASUREMENT_DRAINAGE",
      "UF_CRM_DEAL_MG_MEASUREMENT_ACCESS_STATUS",
      "UF_CRM_DEAL_MG_MEASUREMENT_PHOTOS_STATUS",
      "UF_CRM_DEAL_MG_MEASUREMENT_RESULT",
      "UF_CRM_DEAL_MG_MEASUREMENT_APPROVAL_STATUS",
    ],
  },
  {
    name: "mg_contract",
    title: "06 — UMOWA / DOKUMENTY",
    fields: [
      "UF_CRM_DEAL_MG_CONTRACT_NUMBER",
      "UF_CRM_DEAL_MG_CONTRACT_DATE",
      "UF_CRM_DEAL_MG_DOCUMENT_ISSUER",
      "UF_CRM_DEAL_MG_DOCUMENT_VERSION",
      "UF_CRM_DEAL_MG_CONTRACT_NOTES",
    ],
  },
  {
    name: "mg_process",
    title: "07 — PROCES / FOLLOW-UP",
    fields: [
      "UF_CRM_DEAL_MG_NEXT_CONTACT_AT",
      "UF_CRM_DEAL_MG_PHOTOS_STATUS",
      "UF_CRM_DEAL_MG_DEFERRED_UNTIL",
      "UF_CRM_DEAL_MG_DEFERRED_REASON",
      "UF_CRM_DEAL_MG_LOST_REASON",
    ],
  },
  {
    name: "mg_acceptance",
    title: "08 — ODBIÓR / ZAKOŃCZENIE REALIZACJI",
    fields: [
      "UF_CRM_DEAL_MG_ACCEPTANCE_PROTOCOL_NUMBER",
      "UF_CRM_DEAL_MG_ACCEPTANCE_AT",
      "UF_CRM_DEAL_MG_INSTALLATION_COMPLETED_DATE",
      "UF_CRM_DEAL_MG_ACCEPTANCE_RESULT",
      "UF_CRM_DEAL_MG_ACCEPTANCE_STATUS",
      "UF_CRM_DEAL_MG_DEFECTS",
      "UF_CRM_DEAL_MG_ACCEPTANCE_DEFECTS_DUE_DATE",
      "UF_CRM_DEAL_MG_ACCEPTANCE_PHOTOS_STATUS",
      "UF_CRM_DEAL_MG_HANDOVER_DOCUMENTS_STATUS",
      "UF_CRM_DEAL_MG_ACCEPTANCE_OWNER",
      "UF_CRM_DEAL_MG_PAYMENT_STAGE3_DUE_DATE",
    ],
  },
];

const LABELS: Record<string, string> = {
  UF_CRM_DEAL_MG_INSTALL_ADDRESS: "Adres montażu",
  UF_CRM_DEAL_MG_POSTAL_CODE: "Kod pocztowy",
  UF_CRM_DEAL_MG_CITY: "Miejscowość",
  UF_CRM_DEAL_MG_ACCESS_NOTES: "Informacje o dojeździe / miejscu",

  UF_CRM_DEAL_MG_OFFER_NUMBER: "Numer oferty",
  UF_CRM_DEAL_MG_OFFER_VALID_UNTIL: "Oferta ważna do",
  UF_CRM_DEAL_MG_PLANNED_COMPLETION_DATE: "Planowany termin realizacji",
  UF_CRM_DEAL_MG_PAYMENT_METHOD: "Sposób płatności",
  UF_CRM_DEAL_MG_CUSTOM_QUOTE: "Wycena indywidualna",
  UF_CRM_DEAL_MG_SITE_PREPARATION: "Przygotowanie miejsca / podłoża",
  UF_CRM_DEAL_MG_CONSTRUCTION_COLOR: "Kolor konstrukcji",
  UF_CRM_DEAL_MG_DOCUMENT_VAT_PERCENT: "VAT dokumentu / produktów [%]",
  UF_CRM_DEAL_MG_OFFER_NOTES: "Uwagi do oferty",
  UF_CRM_DEAL_MG_TECHNICAL_NOTES: "Uwagi techniczne do dokumentów",

  UF_CRM_DEAL_MG_ADVANCE_PERCENT: "Zaliczka [%]",
  UF_CRM_DEAL_MG_ADVANCE_AMOUNT: "Zaliczka / proforma",
  UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT: "II rata — 50% — kwota",
  UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT: "III rata — 20% — kwota",
  UF_CRM_DEAL_MG_ADVANCE_DUE_DATE: "Termin wpłaty zaliczki",
  UF_CRM_DEAL_MG_PAID_AMOUNT: "Wpłacona kwota",
  UF_CRM_DEAL_MG_REMAINING_AMOUNT: "Pozostało do zapłaty",

  UF_CRM_DEAL_MG_MEASUREMENT_AT: "Termin pomiaru",
  UF_CRM_DEAL_MG_MEASUREMENT_OWNER: "Osoba wykonująca pomiar",
  UF_CRM_DEAL_MG_MEASUREMENT_PROTOCOL_NUMBER: "Numer protokołu pomiaru",
  UF_CRM_DEAL_MG_MEASUREMENT_NOTES: "Notatki z pomiaru",
  UF_CRM_DEAL_MG_MEASUREMENT_CLIENT_NOTES: "Uwagi klienta do pomiaru",
  UF_CRM_DEAL_MG_MEASURED_WIDTH_CM: "Szerokość po pomiarze [cm]",
  UF_CRM_DEAL_MG_MEASURED_DEPTH_CM: "Głębokość po pomiarze [cm]",
  UF_CRM_DEAL_MG_MEASURED_HEIGHT_WALL_CM: "Wysokość przy ścianie [cm]",
  UF_CRM_DEAL_MG_MEASURED_HEIGHT_FRONT_CM: "Wysokość z przodu [cm]",
  UF_CRM_DEAL_MG_MEASUREMENT_GROUND_STATUS: "Stan podłoża / fundamentu",
  UF_CRM_DEAL_MG_MEASUREMENT_WALL_STATUS: "Stan ściany montażowej",
  UF_CRM_DEAL_MG_MEASUREMENT_POWER_STATUS: "Zasilanie przy miejscu montażu",
  UF_CRM_DEAL_MG_MEASUREMENT_DRAINAGE: "Kierunek odprowadzenia wody",
  UF_CRM_DEAL_MG_MEASUREMENT_ACCESS_STATUS: "Dojazd i możliwość rozładunku",
  UF_CRM_DEAL_MG_MEASUREMENT_PHOTOS_STATUS: "Dokumentacja zdjęciowa pomiaru",
  UF_CRM_DEAL_MG_MEASUREMENT_RESULT: "Wynik pomiaru",
  UF_CRM_DEAL_MG_MEASUREMENT_APPROVAL_STATUS: "Status zatwierdzenia protokołu",

  UF_CRM_DEAL_MG_CONTRACT_NUMBER: "Numer umowy",
  UF_CRM_DEAL_MG_CONTRACT_DATE: "Data zawarcia umowy",
  UF_CRM_DEAL_MG_DOCUMENT_ISSUER: "Osoba wystawiająca dokument",
  UF_CRM_DEAL_MG_DOCUMENT_VERSION: "Wersja dokumentacji",
  UF_CRM_DEAL_MG_CONTRACT_NOTES: "Uwagi do umowy",

  UF_CRM_DEAL_MG_NEXT_CONTACT_AT: "Termin następnego kontaktu",
  UF_CRM_DEAL_MG_PHOTOS_STATUS: "Status zdjęć",
  UF_CRM_DEAL_MG_DEFERRED_UNTIL: "Powrót do klienta",
  UF_CRM_DEAL_MG_DEFERRED_REASON: "Powód odroczenia",
  UF_CRM_DEAL_MG_LOST_REASON: "Przyczyna przegranej",

  UF_CRM_DEAL_MG_ACCEPTANCE_PROTOCOL_NUMBER: "Numer protokołu odbioru",
  UF_CRM_DEAL_MG_ACCEPTANCE_AT: "Data i godzina odbioru",
  UF_CRM_DEAL_MG_INSTALLATION_COMPLETED_DATE: "Data zakończenia montażu",
  UF_CRM_DEAL_MG_ACCEPTANCE_RESULT: "Wynik odbioru",
  UF_CRM_DEAL_MG_ACCEPTANCE_STATUS: "Status protokołu odbioru",
  UF_CRM_DEAL_MG_DEFECTS: "Usterki / uwagi",
  UF_CRM_DEAL_MG_ACCEPTANCE_DEFECTS_DUE_DATE: "Termin usunięcia usterek",
  UF_CRM_DEAL_MG_ACCEPTANCE_PHOTOS_STATUS: "Dokumentacja zdjęciowa odbioru",
  UF_CRM_DEAL_MG_HANDOVER_DOCUMENTS_STATUS: "Dokumenty / instrukcje przekazane klientowi",
  UF_CRM_DEAL_MG_ACCEPTANCE_OWNER: "Osoba wykonująca odbiór",
  UF_CRM_DEAL_MG_PAYMENT_STAGE3_DUE_DATE: "Termin płatności III raty",
};

async function main() {
  const command = (process.argv[2] || "audit").toLowerCase();
  const env = loadProvisionerEnv();
  const client = new ProvisionerBitrixClient(
    env.webhookUrl,
    env.requestTimeoutMs,
    env.retryCount
  );

  const current = await getLayout(client);
  const plan = buildPlan(current);

  if (command === "audit" || command === "plan") {
    printPlan(plan);
    writeJson(path.join(env.reportDir, "sales-card-layout-fix-plan.json"), plan);
    console.log();
    console.log("TRYB READ-ONLY — nic nie zapisano w Bitrix24.");
    console.log(`Raport: ${path.join(env.reportDir, "sales-card-layout-fix-plan.json")}`);
    return;
  }

  if (command !== "apply") {
    throw new Error("Dostępne polecenia: audit, plan, apply.");
  }

  const confirm = readArgument("--confirm");
  if (confirm !== CONFIRM_VALUE) {
    throw new Error(`Tryb apply wymaga: --confirm=${CONFIRM_VALUE}`);
  }

  if (plan.moves.length === 0) {
    console.log("Układ jest już poprawny — brak zmian do zapisania.");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(
    env.reportDir,
    `sales-card-layout-before-${timestamp}.json`
  );
  writeJson(backup, current);

  const proposed = applyPlan(current);

  await setLayout(client, proposed);

  const after = await getLayout(client);
  const verify = buildPlan(after);
  writeJson(path.join(env.reportDir, "sales-card-layout-fix-verify.json"), verify);

  if (verify.moves.length !== 0) {
    throw new Error(
      `Zapis wykonano, ale nadal wykryto ${verify.moves.length} nieprawidłowych przypisań. Backup: ${backup}`
    );
  }

  console.log("MoonGlass — układ karty sprzedaży uporządkowany.");
  console.log(`Przeniesiono pól: ${plan.moves.length}`);
  console.log(`Backup przed zmianą: ${backup}`);
  console.log("Weryfikacja: OK");
}

async function getLayout(client: ProvisionerBitrixClient): Promise<AnySection[]> {
  try {
    const result = await client.call<any[]>(
      "crm.item.details.configuration.get",
      {
        entityTypeId: ENTITY_TYPE_ID,
        scope: "C",
        extras: { dealCategoryId: DEAL_CATEGORY_ID },
      }
    );

    if (!Array.isArray(result)) {
      throw new Error("Bitrix24 nie zwrócił wspólnej konfiguracji karty.");
    }

    console.log("API układu karty: crm.item.details.configuration.get");
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      !message.includes("FEATURE_NOT_AVAILABLE_ON_CURRENT_PLAN") &&
      !message.includes("(403)")
    ) {
      throw error;
    }

    console.log(
      "Uniwersalny endpoint układu karty jest niedostępny na bieżącym planie — próbuję endpointu dla Deali."
    );

    const result = await client.call<any[]>(
      "crm.deal.details.configuration.get",
      {
        scope: "C",
        extras: { dealCategoryId: DEAL_CATEGORY_ID },
      }
    );

    if (!Array.isArray(result)) {
      throw new Error(
        "Bitrix24 nie zwrócił wspólnej konfiguracji karty także przez crm.deal.details.configuration.get."
      );
    }

    console.log("API układu karty: crm.deal.details.configuration.get (fallback)");
    return result;
  }
}

async function setLayout(
  client: ProvisionerBitrixClient,
  data: AnySection[]
): Promise<void> {
  try {
    await client.call("crm.item.details.configuration.set", {
      entityTypeId: ENTITY_TYPE_ID,
      scope: "C",
      data,
      extras: { dealCategoryId: DEAL_CATEGORY_ID },
    });
    console.log("Zapis układu: crm.item.details.configuration.set");
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      !message.includes("FEATURE_NOT_AVAILABLE_ON_CURRENT_PLAN") &&
      !message.includes("(403)")
    ) {
      throw error;
    }

    console.log(
      "Uniwersalny endpoint zapisu jest niedostępny — próbuję crm.deal.details.configuration.set."
    );

    await client.call("crm.deal.details.configuration.set", {
      scope: "C",
      data,
      extras: { dealCategoryId: DEAL_CATEGORY_ID },
    });

    console.log("Zapis układu: crm.deal.details.configuration.set (fallback)");
  }
}

function buildPlan(current: AnySection[]) {
  const sectionByField = new Map<string, { name: string; title: string }>();

  for (const section of current) {
    for (const element of section.elements || []) {
      const fieldName = String(element.name || "");
      if (!fieldName) continue;
      sectionByField.set(fieldName, {
        name: String(section.name || ""),
        title: String(section.title || ""),
      });
    }
  }

  const moves: Array<{
    field: string;
    label: string;
    from: string;
    to: string;
  }> = [];

  for (const spec of SECTION_SPECS) {
    for (const field of spec.fields) {
      const currentSection = sectionByField.get(field);
      if (!currentSection) continue;

      if (
        currentSection.name !== spec.name &&
        normalize(currentSection.title) !== normalize(spec.title)
      ) {
        moves.push({
          field,
          label: LABELS[field] || field,
          from: currentSection.title || currentSection.name || "(brak)",
          to: spec.title,
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    moves,
    moveCount: moves.length,
  };
}

function applyPlan(current: AnySection[]): AnySection[] {
  const targetByField = new Map<string, SectionSpec>();
  for (const spec of SECTION_SPECS) {
    for (const field of spec.fields) targetByField.set(field, spec);
  }

  const originalElement = new Map<string, Record<string, any>>();
  for (const section of current) {
    for (const element of section.elements || []) {
      const name = String(element.name || "");
      if (name) originalElement.set(name, { ...element });
    }
  }

  // Zachowujemy wszystkie sekcje i wszystkie niezarządzane pola.
  const output = current.map((section) => ({
    ...section,
    elements: (section.elements || []).filter((element) => {
      const fieldName = String(element.name || "");
      return !targetByField.has(fieldName);
    }),
  }));

  for (const spec of SECTION_SPECS) {
    let section = output.find(
      (item) =>
        item.name === spec.name ||
        normalize(item.title) === normalize(spec.title)
    );

    if (!section) {
      const productsIndex = output.findIndex((item) => item.name === "products");
      section = {
        name: spec.name,
        title: spec.title,
        type: "section",
        elements: [],
      };
      if (productsIndex >= 0) output.splice(productsIndex, 0, section);
      else output.push(section);
    } else {
      section.title = spec.title;
    }

    section.elements = [
      ...(section.elements || []),
      ...spec.fields
        .filter((field) => originalElement.has(field))
        .map((field) => ({ ...originalElement.get(field)! })),
    ];
  }

  return output;
}

function normalize(value: unknown): string {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("pl-PL")
    .replace(/\s+/g, " ");
}

function printPlan(plan: ReturnType<typeof buildPlan>) {
  console.log("MoonGlass — audyt układu karty 01 Sprzedaż z pomiarem");
  console.log(`Nieprawidłowe przypisania pól: ${plan.moveCount}`);
  console.log();

  if (plan.moves.length === 0) {
    console.log("OK — kontrolowane pola są już w odpowiednich sekcjach.");
    return;
  }

  for (const move of plan.moves) {
    console.log(`- ${move.label}`);
    console.log(`    Z: ${move.from}`);
    console.log(`    DO: ${move.to}`);
  }
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
