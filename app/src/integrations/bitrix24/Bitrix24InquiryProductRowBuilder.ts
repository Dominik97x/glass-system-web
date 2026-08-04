import generatedPricingSnapshot from "@/data/pricing/glass-system/published-pricing.generated.json";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import { getProductKind } from "@/domain/ProductConfiguration";
import type { Bitrix24Client } from "./Bitrix24Client";
import type { Bitrix24ProductRow } from "./Bitrix24Types";

interface PricingMatrixRow {
  productType: "terrace_roof" | "winter_garden";
  widthCm: number;
  lengthCm: number;
  constructionGross: number;
  wallGlassClearGross: number;
  wallGlassMilkyGross: number;
  wallGlassTintedGross: number;
  roofPolycarbonateClearGross: number;
  roofPolycarbonateMilkyGross: number;
  roofPolycarbonateGreyGross: number;
  roofPolycarbonateSmokeGross: number;
  roofGlassClearGross: number;
  roofGlassMilkyGross: number;
  roofGlassTintedGross: number;
  zipRightGross: number;
  zipLeftGross: number;
  zipFrontGross: number;
  awningGross: number;
  levelingProfileGross: number;
  ledSpotGross: number;
  ledStripGross: number;
  handlesGross: number;
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
  priceGross: number;
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
    const total = roundMoney(
      preparedRows.reduce((sum, row) => sum + row.priceGross, 0)
    );

    if (!nearlyEqual(total, inquiry.quote.totalGross)) {
      throw new Error(
        `Rozbicie pozycji Bitrix24 nie zgadza się z wyceną serwera. Oczekiwano ${inquiry.quote.totalGross.toFixed(
          2
        )} PLN, otrzymano ${total.toFixed(2)} PLN.`
      );
    }

    const result: Bitrix24ProductRow[] = [];

    for (const [index, row] of preparedRows.entries()) {
      const productId = await this.findCatalogProductId(row.sku);
      result.push({
        ...(productId !== null ? { productId } : {}),
        productName: row.productName,
        price: row.priceGross,
        quantity: 1,
        sort: (index + 1) * 10,
        taxRate: vatRate,
        taxIncluded: "Y",
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
  const add = (skuPart: string, name: string, priceGross: number): void => {
    if (priceGross <= 0) return;
    result.push({
      sku: `MG-${skuPart}-${suffix}`,
      productName: `${name} ${dimension}`,
      priceGross,
    });
  };

  if (productType === "winter_garden") {
    add("WG-BASE", "Ogród zimowy", row.constructionGross);
  } else {
    add("TR-BASE", "Zadaszenie tarasu", row.constructionGross);
  }

  const roofDefinitions = {
    polycarbonate_clear: ["ROOF-POLY-CLEAR", "Poliwęglan bezbarwny", row.roofPolycarbonateClearGross],
    polycarbonate_milky: ["ROOF-POLY-MILKY", "Poliwęglan mleczny", row.roofPolycarbonateMilkyGross],
    polycarbonate_grey: ["ROOF-POLY-GREY", "Poliwęglan szary", row.roofPolycarbonateGreyGross],
    polycarbonate_smoke: ["ROOF-POLY-SMOKE", "Poliwęglan dymiony", row.roofPolycarbonateSmokeGross],
    glass_clear: ["ROOF-GLASS-CLEAR", "Szkło dachowe bezbarwne", row.roofGlassClearGross],
    glass_milky: ["ROOF-GLASS-MILKY", "Szkło dachowe mleczne", row.roofGlassMilkyGross],
    glass_tinted: ["ROOF-GLASS-TINTED", "Szkło dachowe przyciemniane", row.roofGlassTintedGross],
  } as const;
  const roof = roofDefinitions[configuration.roof];
  add(roof[0], roof[1], roof[2]);

  if (configuration.walls === "glass_clear") {
    add("WALL-CLEAR", "Ściany przesuwne bezbarwne", row.wallGlassClearGross);
  } else if (configuration.walls === "glass_milky") {
    add("WALL-MILKY", "Ściany przesuwne mleczne", row.wallGlassMilkyGross);
  } else if (configuration.walls === "glass_tinted") {
    add("WALL-TINTED", "Ściany przesuwne przyciemniane", row.wallGlassTintedGross);
  }

  if (configuration.walls !== "none" && configuration.hasLeftZip) {
    add("ZIP-LEFT", "Roleta ZIP LEWA", row.zipLeftGross);
  }
  if (configuration.walls !== "none" && configuration.hasRightZip) {
    add("ZIP-RIGHT", "Roleta ZIP PRAWA", row.zipRightGross);
  }
  if (configuration.hasFrontZip) {
    add("ZIP-FRONT", "Roleta ZIP PRZÓD", row.zipFrontGross);
  }
  if (configuration.hasAwning) {
    add("AWNING", "Markiza dachowa", row.awningGross);
  }
  if (configuration.hasLed) {
    add("LED-POINT", "Oświetlenie LED punktowe", row.ledSpotGross);
  }
  if (configuration.hasCob) {
    add("LED-CCT", "Oświetlenie LED CCT", row.ledStripGross);
  }
  if (configuration.hasLevelingProfile) {
    add(
      "FOUNDATION",
      "Profil poziomujący / przygotowanie fundamentu",
      row.levelingProfileGross
    );
  }
  if (configuration.hasBrushes) {
    add("BRUSHES", "Zestaw szczotek przeciwkurzowych", row.brushesGross);
  }
  if (configuration.hasHandles) {
    add("HANDLES", "Zestaw uchwytów", row.handlesGross);
  }

  return result;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 0.01;
}
