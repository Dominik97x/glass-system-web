import fs from "node:fs";
import path from "node:path";

import { MOONGLASS_BLUEPRINT } from "./blueprint";
import { ProvisionerBitrixClient } from "./client";
import {
  buildPublishedCatalogProducts,
  type CatalogProductSummary,
} from "./catalog-products";
import type { ProvisionerEnv } from "./env";
import type {
  BitrixCatalog,
  BitrixCatalogSection,
  BitrixProduct,
  ProductBlueprint,
} from "./types";

const SOURCE_REPORT_JSON = "full-catalog-source.json";
const SOURCE_REPORT_MD = "full-catalog-source.md";
const PLAN_REPORT_JSON = "full-catalog-plan.json";
const PLAN_REPORT_MD = "full-catalog-plan.md";
const APPLY_REPORT_JSON = "full-catalog-apply.json";
const APPLY_REPORT_MD = "full-catalog-apply.md";
const VERIFY_REPORT_JSON = "full-catalog-verify.json";
const VERIFY_REPORT_MD = "full-catalog-verify.md";

interface CatalogMeasure {
  id: number;
  code: number;
  measureTitle?: string;
  symbol?: string;
  symbolIntl?: string;
  symbolLetterIntl?: string;
}

interface CatalogPriceType {
  id: number;
  base?: "Y" | "N" | boolean;
}

interface CatalogPrice {
  id: number;
  productId: number;
  catalogGroupId: number;
  price: number | string;
  currency: string;
}

interface PortalProduct extends BitrixProduct {
  active?: "Y" | "N" | boolean;
  measure?: number | string;
  sort?: number | string;
  detailText?: string;
}

export type FullCatalogActionKind = "create" | "update" | "reuse";

export interface FullCatalogAction {
  kind: FullCatalogActionKind;
  sku: string;
  name: string;
  priceGross: number;
  sectionKey: string;
  existingProductId?: number;
  existingPriceId?: number;
  reasons: string[];
}

export interface FullCatalogSourceReport {
  generatedAt: string;
  summary: CatalogProductSummary;
  expectedProductCount: number;
  notes: string[];
}

export interface FullCatalogPlanReport {
  generatedAt: string;
  portalHost: string;
  iblockId: number;
  basePriceTypeId: number;
  pieceMeasureId: number;
  pieceMeasureCode: number;
  portalProductCount: number;
  existingManagedProductCount: number;
  desiredProductCount: number;
  createCount: number;
  updateCount: number;
  reuseCount: number;
  extraManagedSkus: string[];
  duplicateManagedSkus: string[];
  catalogCap?: number;
  capRemaining?: number;
  actions: FullCatalogAction[];
  sourceSummary: CatalogProductSummary;
}

export interface FullCatalogApplyOptions {
  confirmValue?: string;
  paidPlanAcknowledgement?: string;
  limit?: number;
  catalogCap?: number;
  delayMs?: number;
}

export interface FullCatalogApplyReport {
  generatedAt: string;
  portalHost: string;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  skippedByLimit: number;
  errors: Array<{ sku: string; error: string }>;
  remainingCreate: number;
  remainingUpdate: number;
  totalDesired: number;
}

export interface FullCatalogVerifyReport {
  generatedAt: string;
  ok: boolean;
  portalHost: string;
  desiredProductCount: number;
  createCount: number;
  updateCount: number;
  reuseCount: number;
  duplicateManagedSkus: string[];
  extraManagedSkus: string[];
}

export class Bitrix24FullCatalogManager {
  private readonly client: ProvisionerBitrixClient;

  constructor(
    private readonly cwd: string,
    private readonly env: ProvisionerEnv
  ) {
    this.client = new ProvisionerBitrixClient(
      env.webhookUrl,
      env.requestTimeoutMs,
      env.retryCount
    );
  }

  writeSourceReport(): FullCatalogSourceReport {
    const { summary } = buildPublishedCatalogProducts(this.cwd);
    const report: FullCatalogSourceReport = {
      generatedAt: new Date().toISOString(),
      summary,
      expectedProductCount: summary.products,
      notes: [
        "D4.2 używa cen katalogowych NETTO. VAT 8%/23% jest ustalany później na poziomie Deala.",
        "Kompletne produkty ZP/ZS/OP/OS, montaż i prawdziwe dopłaty CRM są generowane z crm-core-products.generated.json na podstawie 03_Cennik_uslug_nowy.",
        "published-pricing.generated.json dostarcza tylko dodatki operacyjne współdzielone ze stroną (ZIP, markiza, LED punktowe, fundament, szczotki, uchwyty, zabieraki).",
        "Pozycje techniczne CRM-only są dokładane z crm-catalog-addons.generated.json i służą wyłącznie konstrukcjom niestandardowym; nie składają standardowego ogrodu zimowego.",
        "Ogród zimowy jest jednym kompletnym produktem OP/OS; zadaszenie jest osobnym kompletnym produktem ZP/ZS; montaż pozostaje osobną pozycją.",
        "Szkło dachowe dla długości 550/600 cm pozostaje wyłączone zgodnie z availability.roofGlass=false.",
        "LED RGB CCT jest publikowane jako opcja CRM z aktualną ceną MoonGlass; LED CCT bez RGB jest na razie pominięte zgodnie z informacją o braku dostępności do października.",
        "Importer nie usuwa produktów. Nadmiarowe zarządzane SKU są jedynie raportowane.",
      ],
    };
    this.writeReport(SOURCE_REPORT_JSON, report);
    this.writeText(SOURCE_REPORT_MD, renderSourceMarkdown(report));
    return report;
  }

  async plan(catalogCap?: number): Promise<FullCatalogPlanReport> {
    const build = buildPublishedCatalogProducts(this.cwd);
    const portal = await this.readPortalCatalog();
    const sectionByKey = resolveSections(portal.sections);
    const missingSections = MOONGLASS_BLUEPRINT.catalogSections.filter(
      (desired) => !sectionByKey.has(desired.key)
    );
    if (missingSections.length > 0) {
      throw new Error(
        `Brakuje sekcji katalogu: ${missingSections.map((item) => item.name).join(", ")}. Uruchom npm run bitrix:apply -- --confirm=MOONGLASS.`
      );
    }

    const productsBySku = new Map<string, PortalProduct[]>();
    for (const product of portal.products) {
      const sku = normalizeSku(product.xmlId || product.code);
      if (!sku?.startsWith("MG-")) continue;
      const list = productsBySku.get(sku) ?? [];
      list.push(product);
      productsBySku.set(sku, list);
    }

    const duplicateManagedSkus = [...productsBySku.entries()]
      .filter(([, values]) => values.length > 1)
      .map(([sku]) => sku)
      .sort();
    if (duplicateManagedSkus.length > 0) {
      throw new Error(
        `W katalogu znaleziono zduplikowane zarządzane SKU: ${duplicateManagedSkus.slice(0, 5).join(", ")}. Przerwano plan, aby nie aktualizować przypadkowego produktu.`
      );
    }

    const priceByProductId = new Map<number, CatalogPrice>();
    for (const price of portal.prices) {
      if (Number(price.catalogGroupId) !== portal.basePriceTypeId) continue;
      priceByProductId.set(Number(price.productId), price);
    }

    const desiredSkuSet = new Set(build.products.map((product) => product.sku));
    const extraManagedSkus = [...productsBySku.keys()]
      .filter((sku) => !desiredSkuSet.has(sku))
      .sort();

    const actions: FullCatalogAction[] = [];
    for (const desired of build.products) {
      const existing = productsBySku.get(desired.sku)?.[0];
      const section = sectionByKey.get(desired.sectionKey);
      if (!section) {
        throw new Error(`Brak sekcji ${desired.sectionKey} dla ${desired.sku}.`);
      }
      if (!existing) {
        actions.push({
          kind: "create",
          sku: desired.sku,
          name: desired.name,
          priceGross: desired.priceGross,
          sectionKey: desired.sectionKey,
          reasons: ["brak produktu"],
        });
        continue;
      }

      const reasons: string[] = [];
      if (existing.name !== desired.name) reasons.push("nazwa");
      if (Number(existing.iblockSectionId ?? 0) !== section.id) reasons.push("sekcja");
      if (Number(existing.measure ?? 0) !== portal.pieceMeasure.id) reasons.push("jednostka");
      if (!(existing.active === "Y" || existing.active === true)) reasons.push("aktywność");
      if (Number(existing.sort ?? 0) !== Number(desired.sort ?? 500)) reasons.push("sortowanie");
      if ((existing.detailText ?? "") !== (desired.description ?? "")) reasons.push("opis");

      const existingPrice = priceByProductId.get(existing.id);
      if (!existingPrice) {
        reasons.push("brak ceny bazowej");
      } else if (
        Math.abs(Number(existingPrice.price) - desired.priceGross) > 0.009 ||
        existingPrice.currency !== desired.currency
      ) {
        reasons.push("cena/waluta");
      }

      actions.push({
        kind: reasons.length > 0 ? "update" : "reuse",
        sku: desired.sku,
        name: desired.name,
        priceGross: desired.priceGross,
        sectionKey: desired.sectionKey,
        existingProductId: existing.id,
        existingPriceId: existingPrice?.id,
        reasons,
      });
    }

    const createCount = actions.filter((item) => item.kind === "create").length;
    const updateCount = actions.filter((item) => item.kind === "update").length;
    const reuseCount = actions.filter((item) => item.kind === "reuse").length;
    const normalizedCap = normalizeOptionalPositiveInt(catalogCap);
    const report: FullCatalogPlanReport = {
      generatedAt: new Date().toISOString(),
      portalHost: this.client.portalHost,
      iblockId: portal.iblockId,
      basePriceTypeId: portal.basePriceTypeId,
      pieceMeasureId: portal.pieceMeasure.id,
      pieceMeasureCode: portal.pieceMeasure.code,
      portalProductCount: portal.products.length,
      existingManagedProductCount: productsBySku.size,
      desiredProductCount: build.products.length,
      createCount,
      updateCount,
      reuseCount,
      extraManagedSkus,
      duplicateManagedSkus,
      catalogCap: normalizedCap,
      capRemaining:
        normalizedCap === undefined
          ? undefined
          : Math.max(0, normalizedCap - portal.products.length),
      actions,
      sourceSummary: build.summary,
    };

    this.writeReport(PLAN_REPORT_JSON, report);
    this.writeText(PLAN_REPORT_MD, renderPlanMarkdown(report));
    return report;
  }

  async apply(options: FullCatalogApplyOptions): Promise<FullCatalogApplyReport> {
    if (options.confirmValue !== "MOONGLASS-FULL-CATALOG") {
      throw new Error(
        "Pełny import wymaga potwierdzenia: npm run bitrix:products:full:apply -- --confirm=MOONGLASS-FULL-CATALOG"
      );
    }

    const catalogCap = normalizeOptionalPositiveInt(options.catalogCap);
    if (
      catalogCap === undefined &&
      options.paidPlanAcknowledgement !== "YES"
    ) {
      throw new Error(
        "Nie podano limitu katalogu ani potwierdzenia płatnego planu. W trialu użyj tylko planu. Po zakupie planu dodaj --paid-plan=YES."
      );
    }

    const plan = await this.plan(catalogCap);
    const pending = plan.actions.filter(
      (action) => action.kind === "create" || action.kind === "update"
    );
    const limit = normalizeLimit(options.limit, 100);
    const selected = pending.slice(0, limit);
    const selectedCreates = selected.filter((item) => item.kind === "create").length;

    if (
      catalogCap !== undefined &&
      plan.portalProductCount + selectedCreates > catalogCap
    ) {
      throw new Error(
        `Wybrana partia przekroczyłaby limit katalogu ${catalogCap}. Portal ma ${plan.portalProductCount} produktów, a partia utworzyłaby ${selectedCreates}. Maksymalnie można teraz utworzyć ${Math.max(0, catalogCap - plan.portalProductCount)}.`
      );
    }

    const build = buildPublishedCatalogProducts(this.cwd);
    const desiredBySku = new Map(
      build.products.map((product) => [product.sku, product] as const)
    );
    const sections = await this.listSections(plan.iblockId);
    const sectionByKey = resolveSections(sections);
    const delayMs = normalizeNonNegativeInt(options.delayMs, 500);

    let created = 0;
    let updated = 0;
    const errors: Array<{ sku: string; error: string }> = [];

    for (let index = 0; index < selected.length; index += 1) {
      const action = selected[index];
      const desired = desiredBySku.get(action.sku);
      if (!desired) {
        errors.push({ sku: action.sku, error: "Brak produktu w lokalnym manifeście." });
        continue;
      }
      const section = sectionByKey.get(desired.sectionKey);
      if (!section) {
        errors.push({ sku: action.sku, error: `Brak sekcji ${desired.sectionKey}.` });
        continue;
      }

      try {
        let productId = action.existingProductId;
        if (action.kind === "create") {
          const result = await this.client.call<{ element?: { id?: number | string } }>(
            "catalog.product.add",
            {
              fields: buildProductFields(
                desired,
                plan.iblockId,
                section.id,
                plan.pieceMeasureId
              ),
            }
          );
          productId = Number(result.element?.id);
          if (!Number.isFinite(productId)) {
            throw new Error("Bitrix24 nie zwrócił ID nowego produktu.");
          }
          await this.client.call("catalog.price.add", {
            fields: {
              productId,
              catalogGroupId: plan.basePriceTypeId,
              price: desired.priceGross,
              currency: desired.currency,
            },
          });
          created += 1;
        } else {
          if (!productId) throw new Error("Brak ID istniejącego produktu.");
          await this.client.call("catalog.product.update", {
            id: productId,
            fields: buildProductFields(
              desired,
              plan.iblockId,
              section.id,
              plan.pieceMeasureId,
              false
            ),
          });
          if (action.existingPriceId) {
            await this.client.call("catalog.price.update", {
              id: action.existingPriceId,
              fields: {
                price: desired.priceGross,
                currency: desired.currency,
              },
            });
          } else {
            await this.client.call("catalog.price.add", {
              fields: {
                productId,
                catalogGroupId: plan.basePriceTypeId,
                price: desired.priceGross,
                currency: desired.currency,
              },
            });
          }
          updated += 1;
        }

        const completed = index + 1;
        if (completed === selected.length || completed % 25 === 0) {
          console.log(
            `D4: ${completed}/${selected.length} — utworzono ${created}, zaktualizowano ${updated}, błędy ${errors.length}`
          );
        }
      } catch (error) {
        errors.push({
          sku: action.sku,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (delayMs > 0 && index < selected.length - 1) {
        await sleep(delayMs);
      }
    }

    const postPlan = await this.plan(catalogCap);
    const report: FullCatalogApplyReport = {
      generatedAt: new Date().toISOString(),
      portalHost: this.client.portalHost,
      processed: selected.length,
      created,
      updated,
      failed: errors.length,
      skippedByLimit: Math.max(0, pending.length - selected.length),
      errors,
      remainingCreate: postPlan.createCount,
      remainingUpdate: postPlan.updateCount,
      totalDesired: postPlan.desiredProductCount,
    };
    this.writeReport(APPLY_REPORT_JSON, report);
    this.writeText(APPLY_REPORT_MD, renderApplyMarkdown(report));

    if (errors.length > 0) {
      throw new Error(
        `Import zakończył partię z ${errors.length} błędami. Szczegóły: ${this.reportPath(APPLY_REPORT_JSON)}`
      );
    }
    return report;
  }

  async verify(): Promise<FullCatalogVerifyReport> {
    const plan = await this.plan();
    const report: FullCatalogVerifyReport = {
      generatedAt: new Date().toISOString(),
      ok:
        plan.createCount === 0 &&
        plan.updateCount === 0 &&
        plan.duplicateManagedSkus.length === 0,
      portalHost: plan.portalHost,
      desiredProductCount: plan.desiredProductCount,
      createCount: plan.createCount,
      updateCount: plan.updateCount,
      reuseCount: plan.reuseCount,
      duplicateManagedSkus: plan.duplicateManagedSkus,
      extraManagedSkus: plan.extraManagedSkus,
    };
    this.writeReport(VERIFY_REPORT_JSON, report);
    this.writeText(VERIFY_REPORT_MD, renderVerifyMarkdown(report));
    return report;
  }

  private async readPortalCatalog(): Promise<{
    iblockId: number;
    catalogs: BitrixCatalog[];
    sections: BitrixCatalogSection[];
    products: PortalProduct[];
    prices: CatalogPrice[];
    basePriceTypeId: number;
    pieceMeasure: CatalogMeasure;
  }> {
    const catalogResult = await this.client.call<{ catalogs?: BitrixCatalog[] }>(
      "catalog.catalog.list",
      { select: ["id", "iblockId", "productIblockId", "name", "xmlId"] }
    );
    const catalogs = catalogResult.catalogs ?? [];
    const iblockId = chooseCatalogIblockId(catalogs);
    if (!iblockId) throw new Error("Nie znaleziono katalogu handlowego Bitrix24.");

    const [sections, products, priceTypes, measures] = await Promise.all([
      this.listSections(iblockId),
      this.listProducts(iblockId),
      this.client.listAll<CatalogPriceType>(
        "catalog.priceType.list",
        { select: ["id", "base"], order: { id: "ASC" } },
        (result) => asRecord(result).priceTypes as CatalogPriceType[] ?? []
      ),
      this.client.listAll<CatalogMeasure>(
        "catalog.measure.list",
        {
          select: [
            "id",
            "code",
            "measureTitle",
            "symbol",
            "symbolIntl",
            "symbolLetterIntl",
          ],
          order: { id: "ASC" },
        },
        (result) => asRecord(result).measures as CatalogMeasure[] ?? []
      ),
    ]);

    const basePriceType =
      priceTypes.find((item) => item.base === "Y" || item.base === true) ??
      priceTypes[0];
    if (!basePriceType) throw new Error("Nie znaleziono bazowego typu ceny.");
    const pieceMeasure =
      measures.find((measure) => Number(measure.code) === 796) ??
      measures.find((measure) => {
        const label = [
          measure.measureTitle,
          measure.symbol,
          measure.symbolIntl,
          measure.symbolLetterIntl,
        ]
          .join(" ")
          .toLowerCase();
        return /(^|\s)(szt\.?|pcs?|piece)(\s|$)/i.test(label);
      });
    if (!pieceMeasure) throw new Error("Nie znaleziono jednostki szt. (kod 796).");

    const prices = await this.client.listAll<CatalogPrice>(
      "catalog.price.list",
      {
        select: ["id", "productId", "catalogGroupId", "price", "currency"],
        filter: { catalogGroupId: Number(basePriceType.id) },
        order: { id: "ASC" },
      },
      (result) => asRecord(result).prices as CatalogPrice[] ?? []
    );

    return {
      iblockId,
      catalogs,
      sections,
      products,
      prices,
      basePriceTypeId: Number(basePriceType.id),
      pieceMeasure,
    };
  }

  private async listSections(iblockId: number): Promise<BitrixCatalogSection[]> {
    return this.client.listAll<BitrixCatalogSection>(
      "catalog.section.list",
      {
        select: [
          "id",
          "iblockId",
          "iblockSectionId",
          "name",
          "code",
          "xmlId",
          "sort",
        ],
        filter: { iblockId },
        order: { sort: "ASC", id: "ASC" },
      },
      (result) => asRecord(result).sections as BitrixCatalogSection[] ?? []
    );
  }

  private async listProducts(iblockId: number): Promise<PortalProduct[]> {
    return this.client.listAll<PortalProduct>(
      "catalog.product.list",
      {
        select: [
          "id",
          "iblockId",
          "iblockSectionId",
          "name",
          "code",
          "xmlId",
          "active",
          "measure",
          "sort",
          "detailText",
        ],
        filter: { iblockId },
        order: { id: "ASC" },
      },
      (result) => asRecord(result).products as PortalProduct[] ?? []
    );
  }

  private writeReport(fileName: string, value: unknown): void {
    ensureDir(this.env.reportDir);
    fs.writeFileSync(
      this.reportPath(fileName),
      `${JSON.stringify(value, null, 2)}\n`,
      "utf8"
    );
  }

  private writeText(fileName: string, value: string): void {
    ensureDir(this.env.reportDir);
    fs.writeFileSync(this.reportPath(fileName), value, "utf8");
  }

  private reportPath(fileName: string): string {
    return path.join(this.env.reportDir, fileName);
  }
}

function buildProductFields(
  product: ProductBlueprint,
  iblockId: number,
  sectionId: number,
  measureId: number,
  includeIblockId = true
): Record<string, unknown> {
  return {
    ...(includeIblockId ? { iblockId } : {}),
    iblockSectionId: sectionId,
    name: product.name,
    code: product.sku,
    xmlId: product.sku,
    active: "Y",
    measure: measureId,
    sort: product.sort ?? 500,
    detailText: product.description ?? "",
    detailTextType: "text",
  };
}

function resolveSections(
  sections: BitrixCatalogSection[]
): Map<string, BitrixCatalogSection> {
  const result = new Map<string, BitrixCatalogSection>();
  for (const desired of MOONGLASS_BLUEPRINT.catalogSections) {
    const existing = sections.find(
      (section) =>
        section.xmlId === desired.xmlId || section.code === desired.code
    );
    if (existing) result.set(desired.key, existing);
  }
  return result;
}

function chooseCatalogIblockId(catalogs: BitrixCatalog[]): number | undefined {
  for (const catalog of catalogs) {
    const value = catalog.iblockId ?? catalog.productIblockId ?? catalog.id;
    if (value !== undefined && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeSku(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim().toUpperCase();
  return normalized || undefined;
}

function normalizeOptionalPositiveInt(value: number | undefined): number | undefined {
  if (value === undefined || value === 0) return undefined;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Limit katalogu musi być dodatnią liczbą całkowitą.");
  }
  return value;
}

function normalizeNonNegativeInt(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Opóźnienie musi być nieujemną liczbą całkowitą.");
  }
  return value;
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (value === 0) return Number.MAX_SAFE_INTEGER;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Limit partii musi być dodatnią liczbą całkowitą albo 0 dla wszystkich.");
  }
  return value;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderSourceMarkdown(report: FullCatalogSourceReport): string {
  return [
    "# D4 — źródło pełnego katalogu MoonGlass",
    "",
    `- Wersja cennika: \`${report.summary.pricingVersion}\``,
    `- Waluta: \`${report.summary.currency}\``,
    `- Wymiary: **${report.summary.dimensions}**`,
    `- Produkty docelowe: **${report.summary.products}**`,
    `- Produkty rdzenia CRM (ZP/ZS/OP/OS + montaż + dopłaty): **${report.summary.crmCoreProducts}**`,
    `- Dodatki techniczne CRM-only: **${report.summary.crmAddonProducts}**`,
    `- Wyłączone wymiary szkła dachowego: **${report.summary.excludedRoofGlassDimensions}**`,
    "",
    "## Rodziny",
    "",
    ...Object.entries(report.summary.families).map(
      ([family, count]) => `- ${family}: ${count}`
    ),
    "",
    "## Uwagi",
    "",
    ...report.notes.map((note) => `- ${note}`),
    "",
  ].join("\n");
}

function renderPlanMarkdown(report: FullCatalogPlanReport): string {
  return [
    "# D4 — plan synchronizacji pełnego katalogu",
    "",
    `- Portal: \`${report.portalHost}\``,
    `- Produkty w portalu: **${report.portalProductCount}**`,
    `- Zarządzane produkty MG-*: **${report.existingManagedProductCount}**`,
    `- Produkty docelowe: **${report.desiredProductCount}**`,
    `- Utworzyć: **${report.createCount}**`,
    `- Zaktualizować: **${report.updateCount}**`,
    `- Bez zmian: **${report.reuseCount}**`,
    ...(report.catalogCap
      ? [
          `- Zadeklarowany limit katalogu: **${report.catalogCap}**`,
          `- Pozostało do limitu: **${report.capRemaining ?? 0}**`,
        ]
      : []),
    `- Nadmiarowe zarządzane SKU: **${report.extraManagedSkus.length}**`,
    "",
    "## Pierwsze działania",
    "",
    ...report.actions
      .filter((action) => action.kind !== "reuse")
      .slice(0, 100)
      .map(
        (action) =>
          `- ${action.kind === "create" ? "+" : "~"} \`${action.sku}\` — ${action.name}${action.reasons.length ? ` (${action.reasons.join(", ")})` : ""}`
      ),
    report.createCount + report.updateCount > 100
      ? "\n_Pełna lista znajduje się w full-catalog-plan.json._"
      : "",
    "",
  ].join("\n");
}

function renderApplyMarkdown(report: FullCatalogApplyReport): string {
  return [
    "# D4 — wynik partii importu",
    "",
    `- Portal: \`${report.portalHost}\``,
    `- Przetworzono: **${report.processed}**`,
    `- Utworzono: **${report.created}**`,
    `- Zaktualizowano: **${report.updated}**`,
    `- Błędy: **${report.failed}**`,
    `- Pominięto przez limit partii: **${report.skippedByLimit}**`,
    `- Pozostało do utworzenia: **${report.remainingCreate}**`,
    `- Pozostało do aktualizacji: **${report.remainingUpdate}**`,
    "",
    ...(report.errors.length
      ? [
          "## Błędy",
          "",
          ...report.errors.map((item) => `- \`${item.sku}\` — ${item.error}`),
          "",
        ]
      : []),
  ].join("\n");
}

function renderVerifyMarkdown(report: FullCatalogVerifyReport): string {
  return [
    "# D4 — weryfikacja pełnego katalogu",
    "",
    `- Wynik: **${report.ok ? "OK" : "NIEKOMPLETNY"}**`,
    `- Produkty docelowe: **${report.desiredProductCount}**`,
    `- Brakujące: **${report.createCount}**`,
    `- Wymagające aktualizacji: **${report.updateCount}**`,
    `- Zgodne: **${report.reuseCount}**`,
    `- Duplikaty SKU: **${report.duplicateManagedSkus.length}**`,
    `- Nadmiarowe zarządzane SKU: **${report.extraManagedSkus.length}**`,
    "",
  ].join("\n");
}
