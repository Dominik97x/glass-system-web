import generatedPricingSnapshot from "@/data/pricing/glass-system/published-pricing.generated.json";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import { getProductKind } from "@/domain/ProductConfiguration";
import {
  getQuoteSnapshotWebsiteTotalGross,
  hasDetailedQuoteFinancials,
  type QuoteSnapshotItem,
} from "@/lib/quote-snapshot";
import type { Bitrix24Client } from "./Bitrix24Client";
import type { Bitrix24ProductRow } from "./Bitrix24Types";

interface PricingMatrixRow {
  productType: "terrace_roof" | "winter_garden";
  widthCm: number;
  lengthCm: number;

  constructionNet: number;
  constructionGross: number;

  wallGlassClearNet: number;
  wallGlassClearGross: number;
  wallGlassMilkyNet: number;
  wallGlassMilkyGross: number;
  wallGlassTintedNet: number;
  wallGlassTintedGross: number;

  roofPolycarbonateClearNet: number;
  roofPolycarbonateClearGross: number;
  roofPolycarbonateMilkyNet: number;
  roofPolycarbonateMilkyGross: number;
  roofPolycarbonateGreyNet: number;
  roofPolycarbonateGreyGross: number;
  roofPolycarbonateSmokeNet: number;
  roofPolycarbonateSmokeGross: number;
  roofGlassClearNet: number;
  roofGlassClearGross: number;
  roofGlassMilkyNet: number;
  roofGlassMilkyGross: number;
  roofGlassTintedNet: number;
  roofGlassTintedGross: number;

  zipRightNet: number;
  zipRightGross: number;
  zipLeftNet: number;
  zipLeftGross: number;
  zipFrontNet: number;
  zipFrontGross: number;

  awningNet: number;
  awningGross: number;
  levelingProfileNet: number;
  levelingProfileGross: number;

  ledSpotNet: number;
  ledSpotGross: number;
  ledStripNet: number;
  ledStripGross: number;

  handlesNet: number;
  handlesGross: number;
  brushesNet: number;
  brushesGross: number;
  active: boolean;
}

interface CatalogProduct {
  id?: string | number;
  iblockId?: string | number;
  xmlId?: string;
  code?: string;
}

interface CatalogProductListResponse {
  result?: {
    products?: CatalogProduct[];
  };
}

interface CatalogDescriptor {
  id?: string | number;
  iblockId?: string | number;
  productIblockId?: string | number;
}

interface CatalogListResponse {
  result?: {
    catalogs?: CatalogDescriptor[];
  };
}

interface PreparedRow {
  sku: string;
  productName: string;
  priceNet: number;
  websiteGross: number;
  quantity: number;
}

const pricingRows = generatedPricingSnapshot.priceMatrix as PricingMatrixRow[];

export class Bitrix24InquiryProductRowBuilder {
  private readonly productIdCache = new Map<string, number | null>();
  private catalogIblockIdsPromise?: Promise<number[]>;

  constructor(private readonly client: Bitrix24Client) {}

  async build(
    inquiry: StoredCalculatorInquiryLead,
    measureCode: number,
    vatRate: number
  ): Promise<Bitrix24ProductRow[]> {
    const preparedRows = buildPreparedRows(inquiry);
    const websiteGrossTotal = roundMoney(
      preparedRows.reduce((sum, row) => sum + row.websiteGross, 0)
    );

    const expectedWebsiteGross = getQuoteSnapshotWebsiteTotalGross(
      inquiry.quote
    );

    if (!nearlyEqual(websiteGrossTotal, expectedWebsiteGross)) {
      throw new Error(
        `Rozbicie pozycji Bitrix24 nie zgadza się z wyceną strony. Oczekiwano ${expectedWebsiteGross.toFixed(
          2
        )} PLN brutto, otrzymano ${websiteGrossTotal.toFixed(2)} PLN.`
      );
    }

    assertValidVatRate(vatRate);

    const result: Bitrix24ProductRow[] = [];

    for (const [index, row] of preparedRows.entries()) {
      const productId = await this.findCatalogProductId(row.sku);
      result.push({
        ...(productId !== null ? { productId } : {}),
        productName: row.productName,
        // REST Bitrix24 definiuje pole `price` jako końcową cenę jednostkową
        // zawierającą podatek, nawet gdy TAX_INCLUDED=N. Aby interfejs
        // Bitrixa pokazał row.priceNet jako cenę netto, do API musimy wysłać
        // dokładne brutto obliczone dla wybranej stawki VAT.
        price: calculateBitrixApiPriceFromNet(row.priceNet, vatRate),
        quantity: row.quantity,
        sort: (index + 1) * 10,
        taxRate: vatRate,
        taxIncluded: "N",
        measureCode,
      });
    }

    return result;
  }

  private async findCatalogProductId(sku: string): Promise<number | null> {
    if (this.productIdCache.has(sku)) {
      return this.productIdCache.get(sku) ?? null;
    }

    try {
      const iblockIds = await this.getCatalogIblockIds();

      for (const iblockId of iblockIds) {
        const response = await this.client.call<CatalogProductListResponse>(
          "catalog.product.list",
          {
            // Bitrix24 wymaga obecnie id i iblockId zarówno w select,
            // jak i iblockId w filtrze catalog.product.list.
            select: ["id", "iblockId", "xmlId", "code"],
            filter: { iblockId, xmlId: sku },
            order: { id: "ASC" },
          }
        );
        const products = response.result?.products ?? [];
        const matching = products.find(
          (product) => product.xmlId === sku || product.code === sku
        );
        const productId = Number(matching?.id);

        if (Number.isFinite(productId) && productId > 0) {
          this.productIdCache.set(sku, productId);
          return productId;
        }
      }

      this.productIdCache.set(sku, null);
      return null;
    } catch (error) {
      console.warn(
        `Nie udało się odczytać produktu katalogowego ${sku}; pozycja zostanie zapisana jako niestandardowa.`,
        error instanceof Error ? error.message : String(error)
      );
      this.productIdCache.set(sku, null);
      return null;
    }
  }

  private async getCatalogIblockIds(): Promise<number[]> {
    if (!this.catalogIblockIdsPromise) {
      this.catalogIblockIdsPromise = this.loadCatalogIblockIds().catch(
        (error) => {
          this.catalogIblockIdsPromise = undefined;
          throw error;
        }
      );
    }

    return this.catalogIblockIdsPromise;
  }

  private async loadCatalogIblockIds(): Promise<number[]> {
    const response = await this.client.call<CatalogListResponse>(
      "catalog.catalog.list",
      {
        select: ["id", "iblockId", "productIblockId", "name"],
        order: { id: "ASC" },
      }
    );
    const catalogs = response.result?.catalogs ?? [];
    const candidates: number[] = [];

    const addCandidate = (value: unknown): void => {
      const parsed = Number(value);
      if (
        Number.isFinite(parsed) &&
        parsed > 0 &&
        !candidates.includes(parsed)
      ) {
        candidates.push(parsed);
      }
    };

    // Dla katalogu wariantów productIblockId wskazuje katalog produktów
    // nadrzędnych. Produkty MoonGlass są produktami prostymi, dlatego ten
    // identyfikator sprawdzamy przed blokiem ofert.
    for (const catalog of catalogs) {
      addCandidate(catalog.productIblockId);
      addCandidate(catalog.iblockId);
      addCandidate(catalog.id);
    }

    if (candidates.length === 0) {
      throw new Error(
        "Bitrix24 nie zwrócił identyfikatora katalogu produktów (iblockId)."
      );
    }

    return candidates;
  }
}

function buildPreparedRows(
  inquiry: StoredCalculatorInquiryLead
): PreparedRow[] {
  if (hasDetailedQuoteFinancials(inquiry.quote)) {
    return buildPreparedRowsFromFinancialSnapshot(inquiry);
  }

  const configuration = inquiry.quote.configuration;
  const productType = getProductKind(configuration);
  const row = pricingRows.find(
    (candidate) =>
      candidate.active &&
      candidate.productType === productType &&
      candidate.widthCm === configuration.width &&
      candidate.lengthCm === configuration.length
  );

  if (!row) {
    throw new Error(
      `Brak aktywnego wiersza cennika dla ${productType} ${configuration.length}×${configuration.width} cm.`
    );
  }

  const suffix = `D${configuration.length}-W${configuration.width}`;
  const dimension = `${configuration.length}×${configuration.width} cm`;
  const result: PreparedRow[] = [];
  const add = (
    skuPart: string,
    name: string,
    priceNet: number,
    websiteGross: number
  ): void => {
    if (priceNet <= 0 && websiteGross <= 0) return;

    if (priceNet <= 0 || websiteGross <= 0) {
      throw new Error(
        `Niespójna cena ${name} ${dimension}: netto=${priceNet}, brutto strony=${websiteGross}.`
      );
    }

    result.push({
      sku: `MG-${skuPart}-${suffix}`,
      productName: `${name} ${dimension}`,
      priceNet: roundMoney(priceNet),
      websiteGross: roundMoney(websiteGross),
      quantity: 1,
    });
  };

  if (productType === "winter_garden") {
    add(
      "WG-BASE",
      "Ogród zimowy",
      row.constructionNet,
      row.constructionGross
    );
  } else {
    add(
      "TR-BASE",
      "Zadaszenie tarasu",
      row.constructionNet,
      row.constructionGross
    );
  }

  const roofDefinitions = {
    polycarbonate_clear: [
      "ROOF-POLY-CLEAR",
      "Poliwęglan bezbarwny",
      row.roofPolycarbonateClearNet,
      row.roofPolycarbonateClearGross,
    ],
    polycarbonate_milky: [
      "ROOF-POLY-MILKY",
      "Poliwęglan mleczny",
      row.roofPolycarbonateMilkyNet,
      row.roofPolycarbonateMilkyGross,
    ],
    polycarbonate_grey: [
      "ROOF-POLY-GREY",
      "Poliwęglan szary",
      row.roofPolycarbonateGreyNet,
      row.roofPolycarbonateGreyGross,
    ],
    polycarbonate_smoke: [
      "ROOF-POLY-SMOKE",
      "Poliwęglan dymiony",
      row.roofPolycarbonateSmokeNet,
      row.roofPolycarbonateSmokeGross,
    ],
    glass_clear: [
      "ROOF-GLASS-CLEAR",
      "Szkło dachowe bezbarwne",
      row.roofGlassClearNet,
      row.roofGlassClearGross,
    ],
    glass_milky: [
      "ROOF-GLASS-MILKY",
      "Szkło dachowe mleczne",
      row.roofGlassMilkyNet,
      row.roofGlassMilkyGross,
    ],
    glass_tinted: [
      "ROOF-GLASS-TINTED",
      "Szkło dachowe przyciemniane",
      row.roofGlassTintedNet,
      row.roofGlassTintedGross,
    ],
  } as const;
  const roof = roofDefinitions[configuration.roof];
  add(roof[0], roof[1], roof[2], roof[3]);

  if (configuration.walls === "glass_clear") {
    add(
      "WALL-CLEAR",
      "Ściany przesuwne bezbarwne",
      row.wallGlassClearNet,
      row.wallGlassClearGross
    );
  } else if (configuration.walls === "glass_milky") {
    add(
      "WALL-MILKY",
      "Ściany przesuwne mleczne",
      row.wallGlassMilkyNet,
      row.wallGlassMilkyGross
    );
  } else if (configuration.walls === "glass_tinted") {
    add(
      "WALL-TINTED",
      "Ściany przesuwne przyciemniane",
      row.wallGlassTintedNet,
      row.wallGlassTintedGross
    );
  }

  if (configuration.walls !== "none" && configuration.hasLeftZip) {
    add("ZIP-LEFT", "Roleta ZIP LEWA", row.zipLeftNet, row.zipLeftGross);
  }
  if (configuration.walls !== "none" && configuration.hasRightZip) {
    add("ZIP-RIGHT", "Roleta ZIP PRAWA", row.zipRightNet, row.zipRightGross);
  }
  if (configuration.hasFrontZip) {
    add("ZIP-FRONT", "Roleta ZIP PRZÓD", row.zipFrontNet, row.zipFrontGross);
  }
  if (configuration.hasAwning) {
    add("AWNING", "Markiza dachowa", row.awningNet, row.awningGross);
  }
  if (configuration.hasLed) {
    add(
      "LED-POINT",
      "Oświetlenie LED punktowe",
      row.ledSpotNet,
      row.ledSpotGross
    );
  }
  if (configuration.hasCob) {
    add("LED-CCT", "Oświetlenie LED CCT", row.ledStripNet, row.ledStripGross);
  }
  if (configuration.hasLevelingProfile) {
    add(
      "FOUNDATION",
      "Profil poziomujący / przygotowanie fundamentu",
      row.levelingProfileNet,
      row.levelingProfileGross
    );
  }
  if (configuration.hasBrushes) {
    add(
      "BRUSHES",
      "Zestaw szczotek przeciwkurzowych",
      row.brushesNet,
      row.brushesGross
    );
  }
  if (configuration.hasHandles) {
    add(
      "HANDLES",
      "Zestaw uchwytów",
      row.handlesNet,
      row.handlesGross
    );
  }

  return result;
}

function buildPreparedRowsFromFinancialSnapshot(
  inquiry: StoredCalculatorInquiryLead
): PreparedRow[] {
  const configuration = inquiry.quote.configuration;
  const productType = getProductKind(configuration);
  const suffix = `D${configuration.length}-W${configuration.width}`;

  return inquiry.quote.items.map((item) => {
    const priceNet = readRequiredPositiveMoney(
      item.unitPriceNet,
      `${item.name} — cena netto`
    );
    const websiteGross = readRequiredPositiveMoney(
      item.websiteUnitPriceGross,
      `${item.name} — cena brutto strony`
    );
    const quantity = readRequiredPositiveNumber(
      item.quantity,
      `${item.name} — ilość`
    );

    return {
      sku: `MG-${getSnapshotSkuPart(item, productType)}-${suffix}`,
      productName: item.name,
      priceNet,
      websiteGross: roundMoney(websiteGross * quantity),
      quantity,
    };
  });
}

function getSnapshotSkuPart(
  item: QuoteSnapshotItem,
  productType: "terrace_roof" | "winter_garden"
): string {
  const mapping: Record<string, string> = {
    construction: productType === "winter_garden" ? "WG-BASE" : "TR-BASE",
    roof_polycarbonate_clear: "ROOF-POLY-CLEAR",
    roof_polycarbonate_milky: "ROOF-POLY-MILKY",
    roof_polycarbonate_grey: "ROOF-POLY-GREY",
    roof_polycarbonate_smoke: "ROOF-POLY-SMOKE",
    roof_glass_clear: "ROOF-GLASS-CLEAR",
    roof_glass_milky: "ROOF-GLASS-MILKY",
    roof_glass_tinted: "ROOF-GLASS-TINTED",
    walls_glass_clear: "WALL-CLEAR",
    walls_glass_milky: "WALL-MILKY",
    walls_glass_tinted: "WALL-TINTED",
    zip_left: "ZIP-LEFT",
    zip_right: "ZIP-RIGHT",
    zip_front: "ZIP-FRONT",
    awning: "AWNING",
    led_point: "LED-POINT",
    led_cct: "LED-CCT",
    leveling_profile: "FOUNDATION",
    brushes: "BRUSHES",
    handles: "HANDLES",
  };
  const skuPart = mapping[item.id];

  if (!skuPart) {
    throw new Error(
      `Brak mapowania SKU dla pozycji snapshotu „${item.id}” (${item.name}).`
    );
  }

  return skuPart;
}

function readRequiredPositiveMoney(
  value: number | undefined,
  label: string
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} ma nieprawidłową wartość: ${String(value)}.`);
  }

  return roundMoney(value);
}

function readRequiredPositiveNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} ma nieprawidłową wartość: ${String(value)}.`);
  }

  return value;
}

function calculateBitrixApiPriceFromNet(
  netPrice: number,
  vatRate: number
): number {
  assertValidVatRate(vatRate);
  return roundMoney(netPrice * (1 + vatRate / 100));
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 0.01;
}

function assertValidVatRate(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Stawka VAT Bitrix24 musi mieścić się w zakresie 0–100%.");
  }
}
