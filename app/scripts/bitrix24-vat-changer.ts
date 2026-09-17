import path from "node:path";
import {
  VAT_CHANGER_USER_FIELDS,
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
  calculateVatChangePreservingNet,
  formatVatChangeSummary,
  isStandardPolishVatRate,
  validateVatRate,
  type VatChangePreview,
} from "../src/lib/vat-changer";
import {
  formatBitrixMoney,
  PAYMENT_SCHEDULE_305020,
} from "../src/lib/payment-schedule";

const FIELDS_CONFIRM_VALUE = "MOONGLASS-VAT-CHANGER-FIELDS";
const DEAL_CONFIRM_VALUE = "MOONGLASS-VAT-CHANGE-DEAL";
const DEAL_ENTITY_TYPE_ID = 2;
const DEAL_OWNER_TYPE = "D";

const AUDIT_FILE = "vat-changer-fields-audit.json";
const PLAN_FILE = "vat-changer-fields-plan.json";
const PLAN_MD_FILE = "vat-changer-fields-plan.md";
const VERIFY_FILE = "vat-changer-fields-verify.json";
const VERIFY_MD_FILE = "vat-changer-fields-verify.md";

const VAT_FIELDS = {
  legacyRate: "UF_CRM_DEAL_MG_VAT_RATE",
  documentRate: "UF_CRM_DEAL_MG_DOCUMENT_VAT_PERCENT",
  status: "UF_CRM_DEAL_MG_VAT_CHANGE_STATUS",
  changedAt: "UF_CRM_DEAL_MG_VAT_CHANGED_AT",
  summary: "UF_CRM_DEAL_MG_VAT_CHANGE_SUMMARY",
} as const;

const PAYMENT_FIELDS = {
  serverTotalGross: "UF_CRM_DEAL_MG_SERVER_TOTAL_GROSS",
  advancePercent: "UF_CRM_DEAL_MG_ADVANCE_PERCENT",
  advanceAmount: "UF_CRM_DEAL_MG_ADVANCE_AMOUNT",
  remainingAmount: "UF_CRM_DEAL_MG_REMAINING_AMOUNT",
  stage2Amount: "UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT",
  stage3Amount: "UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT",
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

interface VatFieldsAudit {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  expectedCount: number;
  readyCount: number;
  missingCount: number;
  incompatibleCount: number;
  fields: FieldStatus[];
}

interface VatFieldsPlan {
  generatedAt: string;
  portalHost: string;
  blueprintVersion: string;
  actions: PlanAction[];
}

interface VatFieldsVerify extends VatFieldsAudit {
  ok: boolean;
}

interface ProductRowResult {
  id?: number | string;
  productId?: number | string;
  productName?: string;
  price?: number | string;
  priceExclusive?: number | string;
  priceNetto?: number | string;
  priceBrutto?: number | string;
  quantity?: number | string;
  discountTypeId?: number | string;
  discountRate?: number | string;
  discountSum?: number | string;
  taxRate?: number | string | null;
  taxIncluded?: "Y" | "N" | string;
  measureCode?: number | string;
  sort?: number | string;
}

interface ProductRowsResult {
  productRows?: ProductRowResult[];
}

interface DealItemResult {
  item?: Record<string, unknown>;
}

interface FieldDefinitionItem {
  ID?: string | number;
  VALUE?: string;
  id?: string | number;
  value?: string;
}

interface FieldDefinition {
  items?: FieldDefinitionItem[];
}

interface DealFieldsResult {
  fields?: Record<string, FieldDefinition>;
}

interface PreparedDealVatChange {
  dealId: number;
  currency: string;
  preview: VatChangePreview;
  originalDeal: Record<string, unknown>;
  originalRows: ProductRowResult[];
  originalPayloadRows: Record<string, unknown>[];
  newPayloadRows: Record<string, unknown>[];
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
    console.log("Plan D6.5.3 — zmieniarka VAT gotowy.");
    console.log(
      `Zmiany: ${plan.actions.filter((item) => item.kind === "create").length}, ostrzeżenia: ${plan.actions.filter((item) => item.kind === "warning").length}`
    );
    console.log(`Raport: ${env.reportDir}`);
    return;
  }

  if (command === "apply") {
    if (confirmValue !== FIELDS_CONFIRM_VALUE) {
      throw new Error(
        `Tryb apply wymaga potwierdzenia: npm run bitrix:vat:apply -- --confirm=${FIELDS_CONFIRM_VALUE}`
      );
    }

    const before = await buildAudit(provisioner);
    saveAudit(env.reportDir, before);
    assertNoIncompatibleFields(before);

    let created = 0;
    for (const desired of VAT_CHANGER_USER_FIELDS) {
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
        `D6.5.3 nie zostało zakończone: brakujące pola ${verify.missingCount}, konflikty ${verify.incompatibleCount}.`
      );
    }

    const baseVerify = await provisioner.verify();
    if (!baseVerify.ok) {
      throw new Error(
        `Pola VAT utworzono, ale pełna weryfikacja wykryła ${baseVerify.remainingActions.length} działań.`
      );
    }

    console.log("Pola zmieniarki VAT D6.5.3 zostały zastosowane.");
    console.log(`Utworzono: ${created}, gotowe: ${verify.readyCount}/${verify.expectedCount}`);
    console.log(`Raporty i mapowanie: ${env.reportDir}`);
    return;
  }

  if (command === "verify") {
    const verify = await buildVerify(provisioner);
    saveVerify(env.reportDir, verify);
    console.log(verify.ok ? "Weryfikacja D6.5.3 OK." : "Weryfikacja D6.5.3 wykryła problemy.");
    console.log(
      `Pola: ${verify.readyCount}/${verify.expectedCount}, brakujące: ${verify.missingCount}, konflikty: ${verify.incompatibleCount}`
    );
    console.log(`Raport: ${env.reportDir}`);
    if (!verify.ok) process.exitCode = 2;
    return;
  }

  if (command === "preview") {
    const dealId = readPositiveIntegerArgument("--deal-id");
    const prepared = await prepareDealVatChange(client, dealId);
    const outputPath = path.join(
      env.reportDir,
      `vat-change-deal-${dealId}-preview.json`
    );
    writeJson(outputPath, buildPreviewReport(prepared));
    printPreview(prepared);
    console.log(`Raport: ${outputPath}`);
    return;
  }

  if (command === "set") {
    if (confirmValue !== DEAL_CONFIRM_VALUE) {
      throw new Error(
        `Tryb set wymaga potwierdzenia: npm run bitrix:vat:set -- --deal-id=3 --rate=23 --confirm=${DEAL_CONFIRM_VALUE}`
      );
    }

    const verify = await buildVerify(provisioner);
    saveVerify(env.reportDir, verify);
    if (!verify.ok) {
      throw new Error("Najpierw zastosuj i zweryfikuj pola D6.5.3.");
    }

    const dealId = readPositiveIntegerArgument("--deal-id");
    const prepared = await prepareDealVatChange(client, dealId);
    const isCustom = !isStandardPolishVatRate(prepared.preview.newVatRate);
    if (isCustom && !hasArgument("--allow-custom-rate")) {
      throw new Error(
        `Stawka ${prepared.preview.newVatRate}% nie jest standardowym presetem 0/5/8/23. Po potwierdzeniu księgowym uruchom ponownie z --allow-custom-rate.`
      );
    }

    const timestamp = fileTimestamp(new Date());
    const backupPath = path.join(
      env.reportDir,
      `vat-change-deal-${dealId}-backup-${timestamp}.json`
    );
    writeJson(backupPath, {
      generatedAt: new Date().toISOString(),
      portalHost: client.portalHost,
      dealId,
      originalDeal: prepared.originalDeal,
      originalRows: prepared.originalRows,
      rollbackPayloadRows: prepared.originalPayloadRows,
    });

    let productRowsChanged = false;
    try {
      await client.call<ProductRowsResult>("crm.item.productrow.set", {
        ownerType: DEAL_OWNER_TYPE,
        ownerId: dealId,
        productRows: prepared.newPayloadRows,
      });
      productRowsChanged = true;

      const updatedDeal = await waitForDealAmount(
        client,
        dealId,
        prepared.preview.totals.newGross
      );
      const currency = readCurrency(updatedDeal, prepared.currency);
      const definitions = await readDealFieldDefinitions(client);
      const legacyLabel =
        prepared.preview.newVatRate === 8 || prepared.preview.newVatRate === 23
          ? `${prepared.preview.newVatRate}%`
          : "Indywidualna";

      const fields: Record<string, unknown> = {
        [VAT_FIELDS.legacyRate]: getEnumValueId(
          definitions,
          VAT_FIELDS.legacyRate,
          legacyLabel
        ),
        [VAT_FIELDS.documentRate]: prepared.preview.newVatRate,
        [VAT_FIELDS.status]: getEnumValueId(
          definitions,
          VAT_FIELDS.status,
          "Przeliczono — do weryfikacji"
        ),
        [VAT_FIELDS.changedAt]: new Date().toISOString(),
        [VAT_FIELDS.summary]: formatVatChangeSummary(prepared.preview),
        [PAYMENT_FIELDS.serverTotalGross]: formatBitrixMoney(
          prepared.preview.totals.newGross,
          currency
        ),
        [PAYMENT_FIELDS.advancePercent]: PAYMENT_SCHEDULE_305020.stage1Percent,
        [PAYMENT_FIELDS.advanceAmount]: formatBitrixMoney(
          prepared.preview.paymentSchedule.stage1Amount,
          currency
        ),
        [PAYMENT_FIELDS.remainingAmount]: formatBitrixMoney(
          prepared.preview.paymentSchedule.remainingAfterStage1,
          currency
        ),
        [PAYMENT_FIELDS.stage2Amount]: formatBitrixMoney(
          prepared.preview.paymentSchedule.stage2Amount,
          currency
        ),
        [PAYMENT_FIELDS.stage3Amount]: formatBitrixMoney(
          prepared.preview.paymentSchedule.stage3Amount,
          currency
        ),
      };

      await client.call("crm.item.update", {
        entityTypeId: DEAL_ENTITY_TYPE_ID,
        id: dealId,
        fields,
        useOriginalUfNames: "Y",
      });

      const resultPath = path.join(
        env.reportDir,
        `vat-change-deal-${dealId}-result.json`
      );
      writeJson(resultPath, {
        generatedAt: new Date().toISOString(),
        portalHost: client.portalHost,
        dealId,
        currency,
        backupPath,
        customRate: isCustom,
        ...buildPreviewReport(prepared),
      });

      console.log(`VAT w Dealu #${dealId} został przeliczony na ${prepared.preview.newVatRate}%.`);
      console.log(formatVatApplyMode(prepared.originalRows));
      console.log(
        `Brutto: ${prepared.preview.totals.currentGross.toFixed(2)} → ${prepared.preview.totals.newGross.toFixed(2)} ${currency}`
      );
      console.log(
        `Raty 30/50/20: ${prepared.preview.paymentSchedule.stage1Amount.toFixed(2)} / ${prepared.preview.paymentSchedule.stage2Amount.toFixed(2)} / ${prepared.preview.paymentSchedule.stage3Amount.toFixed(2)} ${currency}`
      );
      console.log(`Backup: ${backupPath}`);
      console.log(`Raport: ${resultPath}`);
      return;
    } catch (error) {
      if (productRowsChanged) {
        try {
          await client.call<ProductRowsResult>("crm.item.productrow.set", {
            ownerType: DEAL_OWNER_TYPE,
            ownerId: dealId,
            productRows: prepared.originalPayloadRows,
          });
          console.error("Zmiana nie została zakończona. Przywrócono poprzednie pozycje produktowe.");
        } catch (rollbackError) {
          console.error(
            `UWAGA: automatyczne przywrócenie pozycji nie powiodło się. Użyj backupu ${backupPath}. ${formatError(rollbackError)}`
          );
        }
      }
      throw error;
    }
  }

  throw new Error(
    "Nieznane polecenie. Dostępne: audit, plan, apply, verify, preview, set."
  );
}

async function prepareDealVatChange(
  client: ProvisionerBitrixClient,
  dealId: number
): Promise<PreparedDealVatChange> {
  const [dealResult, rowsResult] = await Promise.all([
    client.call<DealItemResult>("crm.item.get", {
      entityTypeId: DEAL_ENTITY_TYPE_ID,
      id: dealId,
      useOriginalUfNames: "Y",
    }),
    client.call<ProductRowsResult>("crm.item.productrow.list", {
      filter: {
        "=ownerType": DEAL_OWNER_TYPE,
        "=ownerId": dealId,
      },
      order: { sort: "asc" },
    }),
  ]);

  const deal = dealResult.item;
  if (!deal) throw new Error(`Nie udało się odczytać Deala #${dealId}.`);
  const rows = rowsResult.productRows ?? [];
  if (rows.length === 0) {
    throw new Error(`Deal #${dealId} nie ma pozycji produktowych.`);
  }

  const rate = readRequestedRate(deal);
  const vatInputRows = rows.map((row, index) => {
    assertSupportedProductRow(row, index);
    const currentVatRate = parseVatRate(row.taxRate);
    // W crm.item.productrow.* pole `price` jest końcową ceną jednostkową
    // zawierającą rabat i podatek niezależnie od TAX_INCLUDED. Cena netto po
    // rabacie jest zwracana jako priceExclusive. Brak rabatów jest wymagany
    // przez assertSupportedProductRow, więc priceExclusive jest tutaj
    // właściwą ceną netto do zachowania.
    const storedPrice = parseMoney(row.price);
    const unitGross = storedPrice;
    const unitNet = readProductRowNetPrice(
      row,
      storedPrice,
      currentVatRate
    );

    return {
      index: index + 1,
      productName: String(row.productName ?? `Pozycja ${index + 1}`),
      unitGross,
      unitNet,
      quantity: parsePositiveNumber(row.quantity ?? 1, "Ilość"),
      currentVatRate,
    };
  });
  const preview = calculateVatChangePreservingNet(vatInputRows, rate);

  return {
    dealId,
    currency: readCurrency(deal, "PLN"),
    preview,
    originalDeal: deal,
    originalRows: rows,
    originalPayloadRows: rows.map((row, index) =>
      createProductRowPayload(
        row,
        parseMoney(row.price),
        parseVatRate(row.taxRate),
        normalizeTaxIncluded(row.taxIncluded),
        index
      )
    ),
    newPayloadRows: rows.map((row, index) => {
      const taxIncluded = normalizeTaxIncluded(row.taxIncluded);

      // Pole price REST zawsze zawiera podatek. Aby zachować netto przy
      // zmianie stawki, zapisujemy nowe brutto również dla TAX_INCLUDED=N.
      const price = preview.rows[index].newUnitGross;

      return createProductRowPayload(
        row,
        price,
        preview.newVatRate,
        taxIncluded,
        index
      );
    }),
  };
}

function buildPreviewReport(prepared: PreparedDealVatChange): Record<string, unknown> {
  return {
    generatedAt: new Date().toISOString(),
    dealId: prepared.dealId,
    currency: prepared.currency,
    mode: getVatPriceModel(prepared.originalRows),
    standardRate: isStandardPolishVatRate(prepared.preview.newVatRate),
    preview: prepared.preview,
  };
}

function formatVatApplyMode(rows: ProductRowResult[]): string {
  const mode = getVatPriceModel(rows);

  if (mode === "net-price-tax-not-included") {
    return "Tryb: zachowano ceny netto; zaktualizowano stawkę VAT i techniczną cenę brutto wymaganą przez API Bitrix24.";
  }

  if (mode === "gross-price-tax-included") {
    return "Tryb zgodności wstecznej: zachowano netto i przeliczono ceny brutto zapisane w pozycjach.";
  }

  return "Tryb mieszany: zachowano netto każdej pozycji zgodnie z jej TAX_INCLUDED.";
}

function getVatPriceModel(rows: ProductRowResult[]): string {
  const models = new Set(rows.map((row) => normalizeTaxIncluded(row.taxIncluded)));

  if (models.size === 1 && models.has("N")) {
    return "net-price-tax-not-included";
  }

  if (models.size === 1 && models.has("Y")) {
    return "gross-price-tax-included";
  }

  return "mixed-preserve-net";
}

function readProductRowNetPrice(
  row: ProductRowResult,
  storedGrossPrice: number,
  vatRate: number
): number {
  const exclusive = parseOptionalMoney(row.priceExclusive);

  if (exclusive !== null) {
    return exclusive;
  }

  return roundMoney(storedGrossPrice / (1 + vatRate / 100));
}

function parseOptionalMoney(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parseMoney(value);
}

function createProductRowPayload(
  row: ProductRowResult,
  price: number,
  taxRate: number,
  taxIncluded: "Y" | "N",
  index: number
): Record<string, unknown> {
  const productId = Number(row.productId);
  const productName = String(row.productName ?? "").trim();
  const measureCode = Number(row.measureCode);
  const sort = Number(row.sort);

  return {
    ...(Number.isFinite(productId) && productId > 0 ? { productId } : {}),
    ...(productName ? { productName } : {}),
    price: roundMoney(price),
    quantity: parsePositiveNumber(row.quantity ?? 1, "Ilość"),
    discountTypeId: 2,
    discountRate: 0,
    discountSum: 0,
    taxRate: validateVatRate(taxRate),
    taxIncluded,
    ...(Number.isFinite(measureCode) && measureCode > 0 ? { measureCode } : {}),
    sort: Number.isFinite(sort) && sort > 0 ? sort : (index + 1) * 10,
  };
}

function assertSupportedProductRow(row: ProductRowResult, index: number): void {
  normalizeTaxIncluded(row.taxIncluded);
  const discountRate = Number(row.discountRate ?? 0);
  const discountSum = Number(row.discountSum ?? 0);
  if (Math.abs(discountRate) > 0.0001 || Math.abs(discountSum) > 0.0001) {
    throw new Error(
      `Pozycja ${index + 1} ma rabat zapisany bezpośrednio w wierszu produktu. Najpierw usuń rabat wiersza albo zastosuj odrębny mechanizm rabatowy.`
    );
  }
}

function normalizeTaxIncluded(value: unknown): "Y" | "N" {
  const normalized = String(value ?? "N").trim().toUpperCase();

  if (normalized === "Y" || normalized === "N") {
    return normalized;
  }

  throw new Error(
    `Nieobsługiwana wartość TAX_INCLUDED: ${String(value)}. Oczekiwano Y albo N.`
  );
}

function readRequestedRate(deal: Record<string, unknown>): number {
  const argument = readArgument("--rate");
  if (argument !== undefined) {
    return validateVatRate(parseDecimal(argument, "--rate"));
  }
  if (hasArgument("--from-deal")) {
    const raw = getRecordValue(deal, VAT_FIELDS.documentRate);
    if (raw === undefined || raw === null || raw === "") {
      throw new Error(
        `Pole „VAT dokumentu / produktów [%]” w Dealu jest puste. Uzupełnij je albo podaj --rate=23.`
      );
    }
    return validateVatRate(parseDecimal(String(raw), VAT_FIELDS.documentRate));
  }
  throw new Error("Podaj --rate=23 albo --from-deal.");
}

async function readDealFieldDefinitions(
  client: ProvisionerBitrixClient
): Promise<Record<string, FieldDefinition>> {
  const result = await client.call<DealFieldsResult>("crm.item.fields", {
    entityTypeId: DEAL_ENTITY_TYPE_ID,
    useOriginalUfNames: "Y",
  });
  return result.fields ?? {};
}

function getEnumValueId(
  fields: Record<string, FieldDefinition>,
  fieldName: string,
  wantedValue: string
): string | number {
  const definition =
    fields[fieldName] ??
    Object.entries(fields).find(
      ([key]) => key.toUpperCase() === fieldName.toUpperCase()
    )?.[1];
  if (!definition) throw new Error(`Bitrix24 nie zwrócił pola ${fieldName}.`);

  const item = definition.items?.find(
    (candidate) => normalize(candidate.VALUE ?? candidate.value) === normalize(wantedValue)
  );
  const id = item?.ID ?? item?.id;
  if (id === undefined || id === null || id === "") {
    throw new Error(`Pole ${fieldName} nie ma wartości listy „${wantedValue}”.`);
  }
  return id;
}

async function waitForDealAmount(
  client: ProvisionerBitrixClient,
  dealId: number,
  expectedGross: number
): Promise<Record<string, unknown>> {
  let lastItem: Record<string, unknown> | undefined;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const result = await client.call<DealItemResult>("crm.item.get", {
      entityTypeId: DEAL_ENTITY_TYPE_ID,
      id: dealId,
      useOriginalUfNames: "Y",
    });
    lastItem = result.item;
    if (lastItem && nearlyEqual(parseMoney(getRecordValue(lastItem, "opportunity")), expectedGross)) {
      return lastItem;
    }
    if (attempt < 10) await sleep(attempt * 350);
  }

  const actual = lastItem
    ? parseMoney(getRecordValue(lastItem, "opportunity"))
    : Number.NaN;
  throw new Error(
    `Bitrix24 nie przeliczył kwoty Deala zgodnie z oczekiwaniem. Oczekiwano ${expectedGross.toFixed(2)}, otrzymano ${Number.isFinite(actual) ? actual.toFixed(2) : "brak"}.`
  );
}

async function buildAudit(
  provisioner: Bitrix24Provisioner
): Promise<VatFieldsAudit> {
  const portal = await provisioner.audit({
    checkMethods: false,
    strictCriticalReads: true,
  });
  const fields = buildStatuses(portal.userFields);
  return {
    generatedAt: new Date().toISOString(),
    portalHost: portal.portalHost,
    blueprintVersion: "D6.5.3-2026-08-05",
    expectedCount: fields.length,
    readyCount: fields.filter((item) => item.status === "ready").length,
    missingCount: fields.filter((item) => item.status === "missing").length,
    incompatibleCount: fields.filter((item) => item.status === "incompatible").length,
    fields,
  };
}

async function buildVerify(
  provisioner: Bitrix24Provisioner
): Promise<VatFieldsVerify> {
  const audit = await buildAudit(provisioner);
  return {
    ...audit,
    ok: audit.missingCount === 0 && audit.incompatibleCount === 0,
  };
}

function buildStatuses(existingFields: BitrixUserField[]): FieldStatus[] {
  return VAT_CHANGER_USER_FIELDS.map((desired) => {
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
        status: "missing" as const,
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
        actualType: existing.userTypeId,
        fieldId: existing.id,
        status: "incompatible" as const,
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
      fieldId: existing.id,
      actualType: existing.userTypeId,
      status: "ready" as const,
    };
  });
}

function buildPlan(audit: VatFieldsAudit): VatFieldsPlan {
  const actions = audit.fields.map<PlanAction>((field) => {
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

function assertNoIncompatibleFields(audit: VatFieldsAudit): void {
  const incompatible = audit.fields.filter((item) => item.status === "incompatible");
  if (incompatible.length === 0) return;
  throw new Error(
    `Wykryto ${incompatible.length} pól o niezgodnych typach: ${incompatible
      .map((item) => `${item.fieldName} (${item.actualType} → ${item.expectedType})`)
      .join(", ")}.`
  );
}

function saveAudit(reportDir: string, audit: VatFieldsAudit): void {
  writeJson(path.join(reportDir, AUDIT_FILE), audit);
}

function savePlan(reportDir: string, plan: VatFieldsPlan): void {
  writeJson(path.join(reportDir, PLAN_FILE), plan);
  const rows = plan.actions
    .map((item) => `| ${item.kind} | ${item.key} | ${escapeMarkdown(item.message)} |`)
    .join("\n");
  writeText(
    path.join(reportDir, PLAN_MD_FILE),
    `# D6.5.3 — plan zmieniarki VAT\n\n- Portal: ${plan.portalHost}\n- Wygenerowano: ${plan.generatedAt}\n- Blueprint: ${plan.blueprintVersion}\n\n| Działanie | Klucz | Opis |\n|---|---|---|\n${rows}\n`
  );
}

function saveVerify(reportDir: string, verify: VatFieldsVerify): void {
  writeJson(path.join(reportDir, VERIFY_FILE), verify);
  const rows = verify.fields
    .map(
      (item) =>
        `| ${item.alias} | ${escapeMarkdown(item.label)} | ${item.expectedType} | ${item.status} |`
    )
    .join("\n");
  writeText(
    path.join(reportDir, VERIFY_MD_FILE),
    `# D6.5.3 — weryfikacja zmieniarki VAT\n\n- Portal: ${verify.portalHost}\n- Wynik: ${verify.ok ? "OK" : "WYMAGA UWAGI"}\n- Gotowe: ${verify.readyCount}/${verify.expectedCount}\n- Brakujące: ${verify.missingCount}\n- Konflikty: ${verify.incompatibleCount}\n\n| Alias | Etykieta | Typ | Status |\n|---|---|---|---|\n${rows}\n`
  );
}

function printAudit(audit: VatFieldsAudit): void {
  console.log("Audyt D6.5.3 — zmieniarka VAT zakończony.");
  console.log(`Portal: ${audit.portalHost}`);
  console.log(
    `Pola: ${audit.readyCount}/${audit.expectedCount}, brakujące: ${audit.missingCount}, konflikty: ${audit.incompatibleCount}`
  );
}

function printPreview(prepared: PreparedDealVatChange): void {
  console.log(`Podgląd zmiany VAT dla Deala #${prepared.dealId}.`);
  console.log(`Nowa stawka: ${prepared.preview.newVatRate}%.`);
  console.log("Tryb: zachowaj ceny netto; przelicz ceny brutto.");
  for (const row of prepared.preview.rows) {
    console.log(
      `${row.index}. ${row.productName}: ${row.unitGross.toFixed(2)} (${row.currentVatRate}%) → ${row.newUnitGross.toFixed(2)} (${row.newVatRate}%)`
    );
  }
  console.log(
    `Razem brutto: ${prepared.preview.totals.currentGross.toFixed(2)} → ${prepared.preview.totals.newGross.toFixed(2)} ${prepared.currency}`
  );
  if (!isStandardPolishVatRate(prepared.preview.newVatRate)) {
    console.log("UWAGA: stawka niestandardowa — przed zapisem wymaga potwierdzenia księgowego.");
  }
}

function readCurrency(deal: Record<string, unknown>, fallback: string): string {
  const value = getRecordValue(deal, "currencyId") ?? getRecordValue(deal, "CURRENCY_ID");
  return String(value ?? fallback ?? "PLN");
}

function getRecordValue(
  record: Record<string, unknown>,
  key: string
): unknown {
  if (key in record) return record[key];
  const wanted = key.toUpperCase();
  const found = Object.entries(record).find(([candidate]) => candidate.toUpperCase() === wanted);
  return found?.[1];
}

function parseVatRate(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  return validateVatRate(parseDecimal(String(value).replace(/%/g, ""), "VAT pozycji"));
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Nieprawidłowa kwota.");
    return value;
  }
  const text = String(value ?? "")
    .split("|")[0]
    .replace(/\s/g, "")
    .replace(",", ".");
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) throw new Error(`Nieprawidłowa kwota: ${String(value)}`);
  return parsed;
}

function parsePositiveNumber(value: unknown, label: string): number {
  const parsed = parseDecimal(String(value), label);
  if (parsed <= 0) throw new Error(`${label} musi być większa od zera.`);
  return parsed;
}

function parseDecimal(value: string, label: string): number {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${label} musi być liczbą.`);
  return parsed;
}

function readPositiveIntegerArgument(name: string): number {
  const value = readArgument(name);
  const parsed = Number(value);
  if (!value || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} musi być dodatnią liczbą całkowitą.`);
  }
  return parsed;
}

function readArgument(name: string): string | undefined {
  const equalsPrefix = `${name}=`;
  const direct = process.argv.find((item) => item.startsWith(equalsPrefix));
  if (direct) return direct.slice(equalsPrefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return undefined;
}

function hasArgument(name: string): boolean {
  return process.argv.includes(name);
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 0.05;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function fileTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
