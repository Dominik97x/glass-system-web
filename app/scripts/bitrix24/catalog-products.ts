import fs from "node:fs";
import path from "node:path";
import type { ProductBlueprint } from "./types";

interface PricingRow {
  productType: "terrace_roof" | "winter_garden";
  widthCm: number;
  lengthCm: number;
  constructionGross: number;
  wallGlassClearGross: number;
  wallGlassMilkyGross?: number;
  wallGlassTintedGross: number;
  roofPolycarbonateClearGross: number;
  roofPolycarbonateMilkyGross: number;
  roofPolycarbonateGreyGross: number;
  roofPolycarbonateSmokeGross: number;
  roofGlassClearGross: number;
  roofGlassMilkyGross?: number;
  roofGlassTintedGross: number;
  zipRightGross: number;
  zipLeftGross: number;
  zipFrontGross: number;
  awningGross: number;
  levelingProfileGross: number;
  ledSpotGross: number;
  ledStripGross: number;
  ledCobGross?: number;
  handlesGross: number;
  brushesGross: number;
  active: boolean;
  availability?: { roofGlass?: boolean; ledRgb?: boolean };
}

interface PricingSnapshot {
  metadata: {
    currency: string;
    pricingVersion?: string;
    workbookVersion?: string;
    source?: string;
  };
  priceMatrix: PricingRow[];
}

interface ProductVariantDefinition {
  family: string;
  familySort: number;
  field: keyof PricingRow;
  skuPart: string;
  name: string;
  sectionKey: string;
  available?: (row: PricingRow) => boolean;
}

export interface CatalogProductBuildOptions {
  dimensions?: string[];
  descriptionPrefix?: string;
}

export interface CatalogProductSummary {
  pricingVersion: string;
  currency: string;
  sourceRows: number;
  activeRows: number;
  dimensions: number;
  products: number;
  families: Record<string, number>;
  excludedRoofGlassDimensions: number;
  duplicateSkus: string[];
  invalidPrices: string[];
}

export interface CatalogProductBuildResult {
  products: ProductBlueprint[];
  summary: CatalogProductSummary;
}

const variants: ProductVariantDefinition[] = [
  { family: "walls_clear", familySort: 300, field: "wallGlassClearGross", skuPart: "WALL-CLEAR", name: "Ściany przesuwne bezbarwne", sectionKey: "walls" },
  { family: "walls_tinted", familySort: 310, field: "wallGlassTintedGross", skuPart: "WALL-TINTED", name: "Ściany przesuwne przyciemniane", sectionKey: "walls" },
  { family: "roof_poly_clear", familySort: 200, field: "roofPolycarbonateClearGross", skuPart: "ROOF-POLY-CLEAR", name: "Poliwęglan bezbarwny", sectionKey: "roof_poly" },
  { family: "roof_poly_milky", familySort: 210, field: "roofPolycarbonateMilkyGross", skuPart: "ROOF-POLY-MILKY", name: "Poliwęglan mleczny", sectionKey: "roof_poly" },
  { family: "roof_poly_grey", familySort: 220, field: "roofPolycarbonateGreyGross", skuPart: "ROOF-POLY-GREY", name: "Poliwęglan szary", sectionKey: "roof_poly" },
  { family: "roof_poly_smoke", familySort: 230, field: "roofPolycarbonateSmokeGross", skuPart: "ROOF-POLY-SMOKE", name: "Poliwęglan dymiony", sectionKey: "roof_poly" },
  { family: "roof_glass_clear", familySort: 240, field: "roofGlassClearGross", skuPart: "ROOF-GLASS-CLEAR", name: "Szkło dachowe bezbarwne", sectionKey: "roof_glass", available: (row) => row.availability?.roofGlass !== false },
  { family: "roof_glass_tinted", familySort: 250, field: "roofGlassTintedGross", skuPart: "ROOF-GLASS-TINTED", name: "Szkło dachowe przyciemniane", sectionKey: "roof_glass", available: (row) => row.availability?.roofGlass !== false },
  { family: "zip_left", familySort: 400, field: "zipLeftGross", skuPart: "ZIP-LEFT", name: "Roleta ZIP LEWA", sectionKey: "zip" },
  { family: "zip_right", familySort: 410, field: "zipRightGross", skuPart: "ZIP-RIGHT", name: "Roleta ZIP PRAWA", sectionKey: "zip" },
  { family: "zip_front", familySort: 420, field: "zipFrontGross", skuPart: "ZIP-FRONT", name: "Roleta ZIP PRZÓD", sectionKey: "zip" },
  { family: "awning", familySort: 500, field: "awningGross", skuPart: "AWNING", name: "Markiza dachowa", sectionKey: "awning" },
  { family: "foundation", familySort: 700, field: "levelingProfileGross", skuPart: "FOUNDATION", name: "Profil poziomujący / przygotowanie fundamentu", sectionKey: "foundation" },
  { family: "led_point", familySort: 600, field: "ledSpotGross", skuPart: "LED-POINT", name: "Oświetlenie LED punktowe", sectionKey: "lighting" },
  { family: "led_cct", familySort: 610, field: "ledStripGross", skuPart: "LED-CCT", name: "Oświetlenie LED CCT", sectionKey: "lighting" },
  { family: "brushes", familySort: 800, field: "brushesGross", skuPart: "BRUSHES", name: "Zestaw szczotek przeciwkurzowych", sectionKey: "accessories" },
  { family: "handles", familySort: 810, field: "handlesGross", skuPart: "HANDLES", name: "Zestaw uchwytów", sectionKey: "accessories" },
];

export function buildPublishedCatalogProducts(
  cwd: string,
  options: CatalogProductBuildOptions = {}
): CatalogProductBuildResult {
  const filePath = path.join(
    cwd,
    "src/data/pricing/glass-system/published-pricing.generated.json"
  );
  const snapshot = JSON.parse(fs.readFileSync(filePath, "utf8")) as PricingSnapshot;
  const wanted = options.dimensions?.length
    ? new Set(options.dimensions.map(normalizeDimension))
    : undefined;
  const products = new Map<string, ProductBlueprint>();
  const duplicateSkus = new Set<string>();
  const invalidPrices: string[] = [];
  const activeDimensions = new Set<string>();
  let excludedRoofGlassDimensions = 0;

  const descriptionPrefix =
    options.descriptionPrefix ?? "Pełny katalog MoonGlass";
  const pricingVersion =
    snapshot.metadata.pricingVersion ||
    snapshot.metadata.workbookVersion ||
    "MoonGlass";
  const currency = snapshot.metadata.currency || "PLN";

  const rows = snapshot.priceMatrix
    .filter((row) => row.active)
    .sort((a, b) => {
      if (a.lengthCm !== b.lengthCm) return a.lengthCm - b.lengthCm;
      if (a.widthCm !== b.widthCm) return a.widthCm - b.widthCm;
      return a.productType.localeCompare(b.productType);
    });

  for (const row of rows) {
    const dimensionKey = `${row.lengthCm}x${row.widthCm}`;
    if (wanted && !wanted.has(dimensionKey)) continue;
    activeDimensions.add(dimensionKey);

    if (row.availability?.roofGlass === false) {
      excludedRoofGlassDimensions += 1;
    }

    const productPrefix = row.productType === "winter_garden" ? "WG" : "TR";
    const productLabel = row.productType === "winter_garden" ? "Ogród zimowy" : "Zadaszenie tarasu";
    const constructionSection = row.productType === "winter_garden" ? "winter_gardens" : "terrace_roofs";
    const family = row.productType === "winter_garden" ? "winter_garden_base" : "terrace_roof_base";
    const familySort = row.productType === "winter_garden" ? 110 : 100;
    const suffix = `D${row.lengthCm}-W${row.widthCm}`;

    addProduct(products, duplicateSkus, invalidPrices, {
      sku: `MG-${productPrefix}-BASE-${suffix}`,
      name: `${productLabel} ${row.lengthCm}×${row.widthCm} cm`,
      sectionKey: constructionSection,
      priceGross: row.constructionGross,
      currency,
      description: buildDescription(descriptionPrefix, pricingVersion, family),
      family,
      sort: buildStableSort(familySort, row.lengthCm, row.widthCm),
    });

    for (const variant of variants) {
      if (variant.available && !variant.available(row)) continue;
      const value = row[variant.field];
      if (typeof value !== "number" || value <= 0) continue;
      addProduct(products, duplicateSkus, invalidPrices, {
        sku: `MG-${variant.skuPart}-${suffix}`,
        name: `${variant.name} ${row.lengthCm}×${row.widthCm} cm`,
        sectionKey: variant.sectionKey,
        priceGross: value,
        currency,
        description: buildDescription(descriptionPrefix, pricingVersion, variant.family),
        family: variant.family,
        sort: buildStableSort(variant.familySort, row.lengthCm, row.widthCm),
      });
    }
  }

  const productList = [...products.values()].sort((a, b) => {
    const sortDiff = Number(a.sort ?? 0) - Number(b.sort ?? 0);
    return sortDiff || a.sku.localeCompare(b.sku);
  });
  const families: Record<string, number> = {};
  for (const product of productList) {
    const family = product.family || "other";
    families[family] = (families[family] ?? 0) + 1;
  }

  const summary: CatalogProductSummary = {
    pricingVersion,
    currency,
    sourceRows: snapshot.priceMatrix.length,
    activeRows: rows.length,
    dimensions: activeDimensions.size,
    products: productList.length,
    families: Object.fromEntries(
      Object.entries(families).sort(([a], [b]) => a.localeCompare(b))
    ),
    // Każdy niedostępny wymiar występuje w dwóch wierszach snapshotu
    // (zadaszenie i ogród zimowy), ale produkt dachu jest współdzielony.
    excludedRoofGlassDimensions: Math.round(excludedRoofGlassDimensions / 2),
    duplicateSkus: [...duplicateSkus].sort(),
    invalidPrices,
  };

  if (productList.length === 0) {
    throw new Error("Pełny katalog nie zawiera żadnych produktów.");
  }
  if (summary.duplicateSkus.length > 0) {
    throw new Error(
      `Wygenerowano zduplikowane SKU: ${summary.duplicateSkus.slice(0, 5).join(", ")}`
    );
  }
  if (summary.invalidPrices.length > 0) {
    throw new Error(
      `Wykryto nieprawidłowe ceny: ${summary.invalidPrices.slice(0, 5).join(", ")}`
    );
  }

  return { products: productList, summary };
}

function addProduct(
  products: Map<string, ProductBlueprint>,
  duplicateSkus: Set<string>,
  invalidPrices: string[],
  product: ProductBlueprint
): void {
  if (!Number.isFinite(product.priceGross) || product.priceGross <= 0) {
    invalidPrices.push(`${product.sku}:${product.priceGross}`);
    return;
  }
  const existing = products.get(product.sku);
  if (existing) {
    // Warianty dodatków są identyczne dla zadaszenia i ogrodu zimowego.
    // Identyczna druga definicja jest prawidłowym deduplikowaniem.
    if (
      existing.name !== product.name ||
      existing.sectionKey !== product.sectionKey ||
      existing.priceGross !== product.priceGross ||
      existing.currency !== product.currency
    ) {
      duplicateSkus.add(product.sku);
    }
    return;
  }
  products.set(product.sku, product);
}

function buildDescription(
  prefix: string,
  pricingVersion: string,
  family: string
): string {
  return [
    prefix,
    `Cennik: ${pricingVersion}`,
    `Rodzina: ${family}`,
    "Zakres: website+crm",
    "Zarządzane automatycznie — nie zmieniaj kodu SKU ręcznie.",
  ].join("\n");
}

function buildStableSort(
  familySort: number,
  lengthCm: number,
  widthCm: number
): number {
  return familySort * 100_000 + lengthCm * 100 + widthCm;
}

export function normalizeDimension(value: string): string {
  return value.toLowerCase().replace(/[×\s]/g, "x").replace(/x+/g, "x");
}
