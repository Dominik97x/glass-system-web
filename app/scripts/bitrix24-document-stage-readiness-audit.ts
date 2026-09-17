import path from "node:path";
import { ProvisionerBitrixClient } from "./bitrix24/client";
import { loadProvisionerEnv } from "./bitrix24/env";
import { writeJson, writeText } from "./bitrix24/io";

type RequirementKind = "field" | "products";

interface Requirement {
  kind: RequirementKind;
  key: string;
  label: string;
}

interface DocumentRule {
  id: string;
  name: string;
  recommendedGate: string;
  requirements: Requirement[];
}

interface StageRule {
  pipeline: "01 Sprzedaż z pomiarem" | "02 Realizacja";
  stage: string;
  requiredFields: { key: string; label: string }[];
  notes?: string[];
}

const REPORT_JSON = "document-stage-readiness-audit.json";
const REPORT_MD = "document-stage-readiness-audit.md";

const F = {
  installAddress: "UF_CRM_DEAL_MG_INSTALL_ADDRESS",
  postalCode: "UF_CRM_DEAL_MG_POSTAL_CODE",
  city: "UF_CRM_DEAL_MG_CITY",

  offerNumber: "UF_CRM_DEAL_MG_OFFER_NUMBER",
  offerValidUntil: "UF_CRM_DEAL_MG_OFFER_VALID_UNTIL",
  plannedCompletion: "UF_CRM_DEAL_MG_PLANNED_COMPLETION_DATE",
  paymentMethod: "UF_CRM_DEAL_MG_PAYMENT_METHOD",
  vatPercent: "UF_CRM_DEAL_MG_DOCUMENT_VAT_PERCENT",
  constructionColor: "UF_CRM_DEAL_MG_CONSTRUCTION_COLOR",
  sitePreparation: "UF_CRM_DEAL_MG_SITE_PREPARATION",

  advanceAmount: "UF_CRM_DEAL_MG_ADVANCE_AMOUNT",
  advanceDueDate: "UF_CRM_DEAL_MG_ADVANCE_DUE_DATE",
  stage2Amount: "UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT",
  stage3Amount: "UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT",
  paidAmount: "UF_CRM_DEAL_MG_PAID_AMOUNT",
  projectPaid: "UF_CRM_DEAL_MG_PROJECT_PAID",

  measurementAt: "UF_CRM_DEAL_MG_MEASUREMENT_AT",
  measurementOwner: "UF_CRM_DEAL_MG_MEASUREMENT_OWNER",
  measurementProtocol: "UF_CRM_DEAL_MG_MEASUREMENT_PROTOCOL_NUMBER",
  measuredWidth: "UF_CRM_DEAL_MG_MEASURED_WIDTH_CM",
  measuredDepth: "UF_CRM_DEAL_MG_MEASURED_DEPTH_CM",
  measuredHeightWall: "UF_CRM_DEAL_MG_MEASURED_HEIGHT_WALL_CM",
  measuredHeightFront: "UF_CRM_DEAL_MG_MEASURED_HEIGHT_FRONT_CM",
  groundStatus: "UF_CRM_DEAL_MG_MEASUREMENT_GROUND_STATUS",
  wallStatus: "UF_CRM_DEAL_MG_MEASUREMENT_WALL_STATUS",
  powerStatus: "UF_CRM_DEAL_MG_MEASUREMENT_POWER_STATUS",
  drainage: "UF_CRM_DEAL_MG_MEASUREMENT_DRAINAGE",
  accessStatus: "UF_CRM_DEAL_MG_MEASUREMENT_ACCESS_STATUS",
  measurementPhotos: "UF_CRM_DEAL_MG_MEASUREMENT_PHOTOS_STATUS",
  measurementResult: "UF_CRM_DEAL_MG_MEASUREMENT_RESULT",
  measurementApproval: "UF_CRM_DEAL_MG_MEASUREMENT_APPROVAL_STATUS",

  contractNumber: "UF_CRM_DEAL_MG_CONTRACT_NUMBER",
  contractDate: "UF_CRM_DEAL_MG_CONTRACT_DATE",

  installationTeam: "UF_CRM_DEAL_MG_INSTALLATION_TEAM",
  installationFrom: "UF_CRM_DEAL_MG_INSTALLATION_FROM",
  installationTo: "UF_CRM_DEAL_MG_INSTALLATION_TO",
  defects: "UF_CRM_DEAL_MG_DEFECTS",

  acceptanceProtocol: "UF_CRM_DEAL_MG_ACCEPTANCE_PROTOCOL_NUMBER",
  acceptanceAt: "UF_CRM_DEAL_MG_ACCEPTANCE_AT",
  installationCompleted: "UF_CRM_DEAL_MG_INSTALLATION_COMPLETED_DATE",
  acceptanceResult: "UF_CRM_DEAL_MG_ACCEPTANCE_RESULT",
  acceptanceStatus: "UF_CRM_DEAL_MG_ACCEPTANCE_STATUS",
  acceptanceDefectsDue: "UF_CRM_DEAL_MG_ACCEPTANCE_DEFECTS_DUE_DATE",
  acceptancePhotos: "UF_CRM_DEAL_MG_ACCEPTANCE_PHOTOS_STATUS",
  handoverDocuments: "UF_CRM_DEAL_MG_HANDOVER_DOCUMENTS_STATUS",
  acceptanceOwner: "UF_CRM_DEAL_MG_ACCEPTANCE_OWNER",
  stage3DueDate: "UF_CRM_DEAL_MG_PAYMENT_STAGE3_DUE_DATE",
} as const;

const labels: Record<string, string> = {
  COMPANY_ID: "Firma",
  CONTACT_ID: "Kontakt",
  OPPORTUNITY: "Kwota deala",

  [F.installAddress]: "Adres montażu",
  [F.postalCode]: "Kod pocztowy",
  [F.city]: "Miejscowość",

  [F.offerNumber]: "Numer oferty",
  [F.offerValidUntil]: "Oferta ważna do",
  [F.plannedCompletion]: "Planowany termin realizacji",
  [F.paymentMethod]: "Sposób płatności",
  [F.vatPercent]: "VAT dokumentu / produktów [%]",
  [F.constructionColor]: "Kolor konstrukcji",
  [F.sitePreparation]: "Przygotowanie miejsca / podłoża",

  [F.advanceAmount]: "I rata — 30% — kwota",
  [F.advanceDueDate]: "Termin wpłaty zaliczki",
  [F.stage2Amount]: "II rata — 50% — kwota",
  [F.stage3Amount]: "III rata — 20% — kwota",
  [F.paidAmount]: "Wpłacona kwota",
  [F.projectPaid]: "Projekt opłacony",

  [F.measurementAt]: "Termin pomiaru",
  [F.measurementOwner]: "Osoba wykonująca pomiar",
  [F.measurementProtocol]: "Numer protokołu pomiaru",
  [F.measuredWidth]: "Szerokość po pomiarze [cm]",
  [F.measuredDepth]: "Głębokość po pomiarze [cm]",
  [F.measuredHeightWall]: "Wysokość przy ścianie [cm]",
  [F.measuredHeightFront]: "Wysokość z przodu [cm]",
  [F.groundStatus]: "Stan podłoża / fundamentu",
  [F.wallStatus]: "Stan ściany montażowej",
  [F.powerStatus]: "Zasilanie przy miejscu montażu",
  [F.drainage]: "Kierunek odprowadzenia wody",
  [F.accessStatus]: "Dojazd i możliwość rozładunku",
  [F.measurementPhotos]: "Dokumentacja zdjęciowa pomiaru",
  [F.measurementResult]: "Wynik pomiaru",
  [F.measurementApproval]: "Status zatwierdzenia protokołu",

  [F.contractNumber]: "Numer umowy",
  [F.contractDate]: "Data zawarcia umowy",

  [F.installationTeam]: "Ekipa montażowa",
  [F.installationFrom]: "Montaż od",
  [F.installationTo]: "Montaż do",
  [F.defects]: "Usterki / uwagi",

  [F.acceptanceProtocol]: "Numer protokołu odbioru",
  [F.acceptanceAt]: "Data i godzina odbioru",
  [F.installationCompleted]: "Data zakończenia montażu",
  [F.acceptanceResult]: "Wynik odbioru",
  [F.acceptanceStatus]: "Status protokołu odbioru",
  [F.acceptanceDefectsDue]: "Termin usunięcia usterek",
  [F.acceptancePhotos]: "Dokumentacja zdjęciowa odbioru",
  [F.handoverDocuments]: "Dokumenty / instrukcje przekazane klientowi",
  [F.acceptanceOwner]: "Osoba wykonująca odbiór",
  [F.stage3DueDate]: "Termin płatności III raty",
};

const req = (key: string): Requirement => ({
  kind: "field",
  key,
  label: labels[key] || key,
});

const productReq: Requirement = {
  kind: "products",
  key: "PRODUCT_ROWS",
  label: "Co najmniej jedna pozycja produktowa",
};

const documentRules: DocumentRule[] = [
  {
    id: "measurement_protocol",
    name: "Protokół Pomiaru",
    recommendedGate: "Pomiar wykonany",
    requirements: [
      req(F.installAddress),
      req(F.postalCode),
      req(F.city),
      req(F.measurementAt),
      req(F.measurementOwner),
      req(F.measurementProtocol),
      req(F.constructionColor),
      req(F.measuredWidth),
      req(F.measuredDepth),
      req(F.measuredHeightWall),
      req(F.measuredHeightFront),
      req(F.groundStatus),
      req(F.wallStatus),
      req(F.powerStatus),
      req(F.drainage),
      req(F.accessStatus),
      req(F.measurementPhotos),
      req(F.measurementResult),
      req(F.measurementApproval),
    ],
  },
  {
    id: "offer",
    name: "Oferta Firma",
    recommendedGate: "Oferta wysłana",
    requirements: [
      req(F.offerNumber),
      req(F.offerValidUntil),
      req(F.plannedCompletion),
      req(F.paymentMethod),
      req(F.vatPercent),
      req(F.constructionColor),
      req(F.sitePreparation),
      productReq,
      req("OPPORTUNITY"),
    ],
  },
  {
    id: "proforma",
    name: "Proforma Firma",
    recommendedGate: "Proforma / umowa wysłana",
    requirements: [
      req(F.offerNumber),
      req(F.advanceDueDate),
      req(F.paymentMethod),
      req(F.vatPercent),
      req(F.advanceAmount),
      req(F.stage2Amount),
      req(F.stage3Amount),
      productReq,
      req("OPPORTUNITY"),
    ],
  },
  {
    id: "contract",
    name: "Umowa Firma",
    recommendedGate: "Wygrany — przekazany do realizacji",
    requirements: [
      req(F.contractNumber),
      req(F.contractDate),
      req(F.offerNumber),
      req(F.plannedCompletion),
      req(F.installAddress),
      req(F.postalCode),
      req(F.city),
      req(F.paymentMethod),
      req(F.vatPercent),
      req(F.advanceAmount),
      req(F.stage2Amount),
      req(F.stage3Amount),
      productReq,
      req("OPPORTUNITY"),
    ],
  },
  {
    id: "acceptance_protocol",
    name: "Protokół Odbioru",
    recommendedGate: "Montaż skończony — nieopłacone / Montaż skończony — gotówka",
    requirements: [
      req(F.acceptanceProtocol),
      req(F.acceptanceAt),
      req(F.installationCompleted),
      req(F.acceptanceResult),
      req(F.acceptanceStatus),
      req(F.acceptancePhotos),
      req(F.handoverDocuments),
      req(F.acceptanceOwner),
      req(F.stage3Amount),
      req(F.stage3DueDate),
      req(F.contractNumber),
      req(F.installAddress),
      req(F.postalCode),
      req(F.city),
    ],
  },
];

const stageRules: StageRule[] = [
  {
    pipeline: "01 Sprzedaż z pomiarem",
    stage: "Pomiar umówiony",
    requiredFields: [
      F.installAddress,
      F.postalCode,
      F.city,
      F.measurementAt,
      F.measurementOwner,
    ].map(asStageField),
  },
  {
    pipeline: "01 Sprzedaż z pomiarem",
    stage: "Pomiar wykonany",
    requiredFields: [
      F.measurementAt,
      F.measurementOwner,
      F.measurementProtocol,
      F.measuredWidth,
      F.measuredDepth,
      F.measuredHeightWall,
      F.measuredHeightFront,
      F.groundStatus,
      F.wallStatus,
      F.powerStatus,
      F.drainage,
      F.accessStatus,
      F.measurementPhotos,
      F.measurementResult,
      F.measurementApproval,
    ].map(asStageField),
  },
  {
    pipeline: "01 Sprzedaż z pomiarem",
    stage: "Przygotowanie oferty",
    requiredFields: [
      F.offerValidUntil,
      F.plannedCompletion,
      F.paymentMethod,
      F.constructionColor,
      F.sitePreparation,
      F.vatPercent,
    ].map(asStageField),
    notes: [
      "To są dane wejściowe do przygotowania dokumentu. Numer oferty rekomendujemy wymagać dopiero przy „Oferta wysłana”.",
    ],
  },
  {
    pipeline: "01 Sprzedaż z pomiarem",
    stage: "Oferta wysłana",
    requiredFields: [
      F.offerNumber,
      F.offerValidUntil,
      F.plannedCompletion,
      F.paymentMethod,
      F.constructionColor,
      F.sitePreparation,
      F.vatPercent,
      "UF_CRM_DEAL_MG_NEXT_CONTACT_AT",
    ].map(asStageField),
    notes: [
      "Wymagalność pola nie potwierdzi obecności produktów. Produkty sprawdza osobny readiness check.",
    ],
  },
  {
    pipeline: "01 Sprzedaż z pomiarem",
    stage: "Proforma / umowa wysłana",
    requiredFields: [
      F.offerNumber,
      F.advanceDueDate,
      F.paymentMethod,
      F.vatPercent,
      F.advanceAmount,
      F.stage2Amount,
      F.stage3Amount,
    ].map(asStageField),
    notes: [
      "Numer umowy nie jest tutaj bezwarunkowo wymagany, bo etap dopuszcza wysłanie samej proformy.",
    ],
  },
  {
    pipeline: "01 Sprzedaż z pomiarem",
    stage: "Wygrany — przekazany do realizacji",
    requiredFields: [
      F.contractNumber,
      F.contractDate,
      F.plannedCompletion,
    ].map(asStageField),
  },
  {
    pipeline: "02 Realizacja",
    stage: "Ustalona ekipa i termin montażu",
    requiredFields: [
      F.installationTeam,
      F.installationFrom,
      F.installationTo,
    ].map(asStageField),
  },
  {
    pipeline: "02 Realizacja",
    stage: "Montaż rozpoczęty",
    requiredFields: [
      F.installationTeam,
      F.installationFrom,
      F.installationTo,
    ].map(asStageField),
  },
  {
    pipeline: "02 Realizacja",
    stage: "Montaż skończony — nieopłacone",
    requiredFields: [
      F.installationCompleted,
      F.acceptanceProtocol,
      F.acceptanceAt,
      F.acceptanceResult,
      F.acceptanceStatus,
      F.acceptancePhotos,
      F.handoverDocuments,
      F.acceptanceOwner,
      F.stage3DueDate,
    ].map(asStageField),
    notes: [
      "Jeżeli wynik to „Odbiór z uwagami / usterkami”, dodatkowo wymagamy biznesowo: Usterki / uwagi + Termin usunięcia usterek.",
      "Sama wymagalność pola nie potrafi sprawdzić, czy Status protokołu = „Podpisany”. To dopniemy osobną walidacją/automatyzacją.",
    ],
  },
  {
    pipeline: "02 Realizacja",
    stage: "Montaż skończony — gotówka",
    requiredFields: [
      F.installationCompleted,
      F.acceptanceProtocol,
      F.acceptanceAt,
      F.acceptanceResult,
      F.acceptanceStatus,
      F.acceptancePhotos,
      F.handoverDocuments,
      F.acceptanceOwner,
    ].map(asStageField),
    notes: [
      "Dla gotówki termin III raty może nie być potrzebny, jeśli płatność następuje przy odbiorze.",
    ],
  },
  {
    pipeline: "02 Realizacja",
    stage: "Projekt opłacony",
    requiredFields: [
      F.acceptanceProtocol,
      F.acceptanceStatus,
      F.paidAmount,
    ].map(asStageField),
    notes: [
      "Wartość „Projekt opłacony = Tak” trzeba zweryfikować logiką biznesową; samo Required nie gwarantuje wartości Tak.",
    ],
  },
  {
    pipeline: "02 Realizacja",
    stage: "Zamknięty projekt",
    requiredFields: [
      F.acceptanceProtocol,
      F.acceptanceStatus,
      F.paidAmount,
    ].map(asStageField),
    notes: [
      "Przed finalnym zamknięciem dopniemy kontrolę: protokół podpisany, brak nierozwiązanych usterek i pełna płatność.",
    ],
  },
];

function asStageField(key: string) {
  return { key, label: labels[key] || key };
}

async function main(): Promise<void> {
  const command = (process.argv[2] || "audit").toLowerCase();
  const dealId = Number(readArgument("--deal-id") || "25");
  if (!Number.isInteger(dealId) || dealId < 1) {
    throw new Error("--deal-id musi być dodatnią liczbą całkowitą.");
  }

  const env = loadProvisionerEnv();
  const client = new ProvisionerBitrixClient(
    env.webhookUrl,
    env.requestTimeoutMs,
    env.retryCount
  );

  const fieldResult = await client.call<any>("crm.item.fields", {
    entityTypeId: 2,
    useOriginalUfNames: "Y",
  });
  const portalFields = fieldResult?.fields || {};
  const missingDefinitions = collectReferencedFieldNames()
    .filter((name) => name.startsWith("UF_"))
    .filter((name) => !portalFields[name]);

  const pipelines = await getPipelines(client);
  const missingStages = stageRules.filter(
    (rule) =>
      !pipelines.some(
        (p) =>
          p.name === rule.pipeline &&
          p.stages.some((s: any) => s.name === rule.stage)
      )
  );

  if (command === "plan") {
    const report = {
      generatedAt: new Date().toISOString(),
      mode: "plan",
      missingFieldDefinitions: missingDefinitions,
      missingStages: missingStages.map((r) => ({
        pipeline: r.pipeline,
        stage: r.stage,
      })),
      stageRules,
      note:
        "Oficjalny REST Bitrix24 nie udostępnia w crm.item.details.configuration informacji o przypisaniu „Wymagane na etapie”. Te reguły trzeba ustawić w UI CRM; ten plan jest checklistą.",
    };
    saveReports(env.reportDir, report);
    printPlan(report);
    return;
  }

  if (command !== "audit") {
    throw new Error("Dostępne polecenia: audit, plan.");
  }

  const deal = await client.call<Record<string, unknown>>("crm.deal.get", {
    id: dealId,
  });

  const productRows = await client.call<any>("crm.item.productrow.list", {
    filter: {
      "=ownerType": "D",
      "=ownerId": dealId,
    },
    select: ["id", "productName", "price", "quantity", "taxRate", "taxIncluded"],
  });

  const rows = Array.isArray(productRows)
    ? productRows
    : Array.isArray(productRows?.productRows)
      ? productRows.productRows
      : Array.isArray(productRows?.items)
        ? productRows.items
        : [];

  const documents = documentRules.map((rule) => {
    const checks = rule.requirements.map((requirement) => {
      if (requirement.kind === "products") {
        return {
          ...requirement,
          ready: rows.length > 0,
          value: rows.length,
        };
      }

      const value = readDealValue(deal, requirement.key);
      return {
        ...requirement,
        ready: isFilled(value),
        value: safeValue(value),
      };
    });

    return {
      id: rule.id,
      name: rule.name,
      recommendedGate: rule.recommendedGate,
      ready: checks.every((item) => item.ready),
      missing: checks.filter((item) => !item.ready).map((item) => item.label),
      checks,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "audit",
    dealId,
    dealTitle: deal.TITLE ?? deal.title ?? null,
    dealStage: deal.STAGE_ID ?? deal.stageId ?? null,
    productRows: rows.length,
    missingFieldDefinitions: missingDefinitions,
    missingStages: missingStages.map((r) => ({
      pipeline: r.pipeline,
      stage: r.stage,
    })),
    documents,
    stageRules,
    note:
      "Readiness dokumentów jest sprawdzany live na Deal. Przypisania „Wymagane na etapie” są checklistą do konfiguracji/weryfikacji w UI CRM.",
  };

  saveReports(env.reportDir, report);
  printAudit(report);
}

async function getPipelines(client: ProvisionerBitrixClient) {
  const categoryResult = await client.call<any>("crm.category.list", {
    entityTypeId: 2,
  });
  const categories = Array.isArray(categoryResult)
    ? categoryResult
    : categoryResult?.categories || categoryResult?.items || [];

  const pipelines = [];

  for (const category of categories) {
    const id = Number(category.id ?? category.ID);
    const name = String(category.name ?? category.NAME ?? "");
    const entityId = id === 0 ? "DEAL_STAGE" : `DEAL_STAGE_${id}`;
    const statusResult = await client.call<any[]>("crm.status.list", {
      filter: { ENTITY_ID: entityId },
    });

    pipelines.push({
      id,
      name,
      stages: (statusResult || []).map((s: any) => ({
        id: String(s.STATUS_ID ?? s.statusId ?? ""),
        name: String(s.NAME ?? s.name ?? ""),
        sort: Number(s.SORT ?? s.sort ?? 0),
        semantics: String(s.SEMANTICS ?? s.semantics ?? ""),
      })),
    });
  }

  return pipelines;
}

function collectReferencedFieldNames(): string[] {
  const names = new Set<string>();

  for (const rule of documentRules) {
    for (const requirement of rule.requirements) {
      if (requirement.kind === "field") names.add(requirement.key);
    }
  }

  for (const stage of stageRules) {
    for (const field of stage.requiredFields) names.add(field.key);
  }

  return [...names];
}

function readDealValue(
  deal: Record<string, unknown>,
  key: string
): unknown {
  if (Object.prototype.hasOwnProperty.call(deal, key)) return deal[key];

  // crm.deal.get zwykle zwraca stare nazwy UF, ale dla bezpieczeństwa
  // sprawdzamy też camelCase dla pól standardowych.
  if (key === "OPPORTUNITY") return deal.OPPORTUNITY ?? deal.opportunity;
  if (key === "COMPANY_ID") return deal.COMPANY_ID ?? deal.companyId;
  if (key === "CONTACT_ID") return deal.CONTACT_ID ?? deal.contactId;

  return undefined;
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return false;
    if (normalized === "0" || normalized === "0.00") return false;
    return true;
  }

  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;

  return true;
}

function safeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === "string" && value.length > 120) {
    return `${value.slice(0, 117)}...`;
  }
  return value;
}

function saveReports(reportDir: string, report: any) {
  writeJson(path.join(reportDir, REPORT_JSON), report);

  const md: string[] = [
    "# MoonGlass — dokumenty i wymagane pola etapów",
    "",
    `Wygenerowano: ${report.generatedAt}`,
    "",
  ];

  if (report.mode === "audit") {
    md.push(`Deal: #${report.dealId} — ${report.dealTitle || ""}`);
    md.push(`Pozycje produktowe: ${report.productRows}`);
    md.push("");
    md.push("## Gotowość dokumentów");
    md.push("");

    for (const doc of report.documents) {
      md.push(`### ${doc.ready ? "✅" : "❌"} ${doc.name}`);
      md.push(`Brama: ${doc.recommendedGate}`);
      if (doc.missing.length) {
        md.push(`Braki: ${doc.missing.join(", ")}`);
      } else {
        md.push("Braki: brak");
      }
      md.push("");
    }
  }

  md.push("## Docelowa macierz etap → wymagane pola");
  md.push("");

  for (const rule of stageRules) {
    md.push(`### ${rule.pipeline} → ${rule.stage}`);
    for (const field of rule.requiredFields) {
      md.push(`- ${field.label} — \`${field.key}\``);
    }
    for (const note of rule.notes || []) {
      md.push(`- **Uwaga:** ${note}`);
    }
    md.push("");
  }

  md.push(
    "> Uwaga: przypisania „Wymagane na etapie” są konfigurowane w Bitrix24 osobno dla lejków. Raport nie zapisuje żadnych zmian."
  );

  writeText(path.join(reportDir, REPORT_MD), md.join("\n"));
}

function printAudit(report: any) {
  console.log("MoonGlass — audyt gotowości dokumentów");
  console.log(`Deal: #${report.dealId} — ${report.dealTitle || ""}`);
  console.log(`Produkty: ${report.productRows}`);
  console.log();

  for (const doc of report.documents) {
    console.log(`${doc.ready ? "OK" : "BRAKI"} — ${doc.name}`);
    if (!doc.ready) {
      for (const missing of doc.missing) console.log(`  - ${missing}`);
    }
  }

  console.log();
  if (report.missingFieldDefinitions.length) {
    console.log("UWAGA — brak definicji pól:");
    for (const field of report.missingFieldDefinitions) {
      console.log(`  - ${field}`);
    }
  } else {
    console.log("Definicje wymaganych pól: OK");
  }

  if (report.missingStages.length) {
    console.log("UWAGA — nie znaleziono etapów:");
    for (const stage of report.missingStages) {
      console.log(`  - ${stage.pipeline} → ${stage.stage}`);
    }
  } else {
    console.log("Etapy z planu: OK");
  }

  console.log(`Raport: .bitrix24\\${REPORT_MD}`);
  console.log("TRYB READ-ONLY — nic nie zapisano w Bitrix24.");
}

function printPlan(report: any) {
  console.log("MoonGlass — PLAN wymaganych pól etapów");
  console.log();

  for (const rule of report.stageRules) {
    console.log(`${rule.pipeline} → ${rule.stage}`);
    for (const field of rule.requiredFields) {
      console.log(`  - ${field.label}`);
    }
    for (const note of rule.notes || []) {
      console.log(`  UWAGA: ${note}`);
    }
    console.log();
  }

  console.log(
    "PLAN jest read-only. Nie zmienia pól, etapów ani danych w Bitrix24."
  );
  console.log(`Raport: .bitrix24\\${REPORT_MD}`);
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
