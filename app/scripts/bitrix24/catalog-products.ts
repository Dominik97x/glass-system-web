import fs from "node:fs";
import path from "node:path";
import type { ProductBlueprint } from "./types";

interface PricingRow {
  productType: "terrace_roof" | "winter_garden";
  widthCm: number;
  lengthCm: number;
  constructionNet: number;
  wallGlassClearNet: number;
  wallGlassMilkyNet?: number;
  wallGlassTintedNet: number;
  roofPolycarbonateClearNet: number;
  roofPolycarbonateMilkyNet: number;
  roofPolycarbonateGreyNet: number;
  roofPolycarbonateSmokeNet: number;
  roofGlassClearNet: number;
  roofGlassMilkyNet?: number;
  roofGlassTintedNet: number;
  zipRightNet: number;
  zipLeftNet: number;
  zipFrontNet: number;
  awningNet: number;
  levelingProfileNet: number;
  ledSpotNet: number;
  ledStripNet: number;
  ledCobNet?: number;
  handlesNet: number;
  brushesNet: number;
  carriersNet?: number;
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

interface CrmCoreProduct {
  sku: string;
  name: string;
  sectionKey: string;
  family: string;
  dimensionKey: string;
  priceNet: number;
  currency: string;
  sort: number;
  source?: string;
  supplierNet?: number;
  supplierGross?: number;
  notes?: string;
}

interface CrmCoreProductSnapshot {
  metadata?: {
    version?: string;
    currency?: string;
    priceMode?: string;
  };
  products: CrmCoreProduct[];
}

interface CrmCatalogAddon {
  sku: string;
  name: string;
  sectionKey: string;
  family: string;
  priceNet: number;
  currency: string;
  sort: number;
  source?: string;
  sourceNet?: number;
  markup?: number;
  notes?: string;
}

interface CrmCatalogAddonSnapshot {
  metadata?: {
    version?: string;
    currency?: string;
    priceMode?: string;
  };
  products: CrmCatalogAddon[];
}

interface ProductVariantDefinition {
  family: string;
  familySort: number;
  field: keyof PricingRow;
  skuPart: string;
  name: string;
  sectionKey: string;
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
  crmCoreProducts: number;
  crmAddonProducts: number;
  families: Record<string, number>;
  excludedRoofGlassDimensions: number;
  duplicateSkus: string[];
  invalidPrices: string[];
}

export interface CatalogProductBuildResult {
  products: ProductBlueprint[];
  summary: CatalogProductSummary;
}

// D4.2: tylko prawdziwe dodatki operacyjne.
// Nie generujemy już pełnych "ścian" ani dopłat konwertujących bazę z poliwęglanu
// na szkło, bo zadaszenie i ogród są pełnymi produktami ZP/ZS/OP/OS.
const variants: ProductVariantDefinition[] = [
  {
    family: "zip_side",
    familySort: 400,
    field: "zipRightNet",
    skuPart: "ZIP-SIDE",
    name: "Roleta ZIP boczna",
    sectionKey: "zip_side",
  },
  {
    family: "zip_front",
    familySort: 420,
    field: "zipFrontNet",
    skuPart: "ZIP-FRONT",
    name: "Roleta ZIP front",
    sectionKey: "zip_front",
  },
  {
    family: "awning",
    familySort: 500,
    field: "awningNet",
    skuPart: "AWNING",
    name: "Markiza dachowa",
    sectionKey: "awning",
  },
  {
    family: "foundation",
    familySort: 700,
    field: "levelingProfileNet",
    skuPart: "FOUNDATION",
    name: "Fundament / profil poziomujący",
    sectionKey: "foundation_profiles",
  },
  {
    family: "led_point",
    familySort: 600,
    field: "ledSpotNet",
    skuPart: "LED-POINT",
    name: "Oświetlenie LED punktowe",
    sectionKey: "lighting_point",
  },
  {
    family: "brushes",
    familySort: 800,
    field: "brushesNet",
    skuPart: "BRUSHES",
    name: "Zestaw szczotek przeciwkurzowych",
    sectionKey: "accessories_brushes",
  },
  {
    family: "handles",
    familySort: 810,
    field: "handlesNet",
    skuPart: "HANDLES",
    name: "Zestaw uchwytów",
    sectionKey: "accessories_handles",
  },
  {
    family: "carriers",
    familySort: 820,
    field: "carriersNet",
    skuPart: "CARRIERS",
    name: "Zabieraki do ścian przesuwnych",
    sectionKey: "accessories_carriers",
  },
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

  // Dodatki z published-pricing są współdzielone przez zadaszenie i ogród.
  // Pętla przejdzie przez dwa rekordy tego samego wymiaru, a addProduct bezpiecznie
  // zredukuje identyczne definicje do jednego SKU.
  for (const row of rows) {
    const dimensionKey = `${row.lengthCm}x${row.widthCm}`;
    if (wanted && !wanted.has(dimensionKey)) continue;
    activeDimensions.add(dimensionKey);

    if (row.availability?.roofGlass === false) {
      excludedRoofGlassDimensions += 1;
    }

    const suffix = `D${row.lengthCm}-W${row.widthCm}`;
    for (const variant of variants) {
      const value = row[variant.field];
      if (typeof value !== "number" || value <= 0) continue;
      addProduct(products, duplicateSkus, invalidPrices, {
        sku: `MG-${variant.skuPart}-${suffix}`,
        name: `${variant.name} — ${row.lengthCm}×${row.widthCm} cm`,
        sectionKey: variant.sectionKey,
        priceGross: value,
        currency,
        description: buildDescription(
          descriptionPrefix,
          pricingVersion,
          variant.family
        ),
        family: variant.family,
        sort: buildStableSort(
          variant.familySort,
          row.lengthCm,
          row.widthCm
        ),
      });
    }
  }

  // D4.2: właściwe produkty handlowe Bitrixa pochodzą z 03_Cennik_uslug_nowy.
  // ZP / ZS / OP / OS są niezależnymi pełnymi produktami, a montaż jest osobno.
  const crmCoreProducts = readCrmCoreProducts(cwd).filter(
    (product) => !wanted || wanted.has(normalizeDimension(product.dimensionKey))
  );
  for (const core of crmCoreProducts) {
    addProduct(products, duplicateSkus, invalidPrices, {
      sku: core.sku,
      name: core.name,
      sectionKey: resolveGeneratedSectionKey(core.sectionKey, core.family),
      // ProductBlueprint.priceGross to historyczna nazwa pola w importerze D4.
      // W katalogu D4.2 przechowujemy tutaj kanoniczną cenę NETTO.
      priceGross: core.priceNet,
      currency: core.currency || currency,
      description: buildCrmCoreDescription(core),
      family: core.family,
      sort: core.sort,
    });
  }

  const crmAddons = wanted ? [] : readCrmCatalogAddons(cwd);
  for (const addon of crmAddons) {
    addProduct(products, duplicateSkus, invalidPrices, {
      sku: addon.sku,
      name: addon.name,
      sectionKey: resolveGeneratedSectionKey(addon.sectionKey, addon.family),
      // ProductBlueprint.priceGross to historyczna nazwa pola w importerze D4.
      // Od D4.1 przechowujemy tutaj kanoniczną cenę katalogową NETTO.
      priceGross: addon.priceNet,
      currency: addon.currency || currency,
      description: buildCrmAddonDescription(addon),
      family: addon.family,
      sort: addon.sort,
    });
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
    crmCoreProducts: crmCoreProducts.length,
    crmAddonProducts: crmAddons.length,
    families: Object.fromEntries(
      Object.entries(families).sort(([a], [b]) => a.localeCompare(b))
    ),
    // Każdy niedostępny wymiar występuje w dwóch wierszach snapshotu.
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

function readCrmCoreProducts(cwd: string): CrmCoreProduct[] {
  const filePath = path.join(
    cwd,
    "src/data/pricing/glass-system/crm-core-products.generated.json"
  );
  if (!fs.existsSync(filePath)) {
    throw new Error(
      "Brakuje crm-core-products.generated.json. Nie generuj katalogu D4.2 ze starego modelu zadaszenie + ściany."
    );
  }

  const snapshot = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  ) as CrmCoreProductSnapshot;
  if (!Array.isArray(snapshot.products)) {
    throw new Error("crm-core-products.generated.json nie zawiera tablicy products.");
  }

  return snapshot.products;
}

function readCrmCatalogAddons(cwd: string): CrmCatalogAddon[] {
  const filePath = path.join(
    cwd,
    "src/data/pricing/glass-system/crm-catalog-addons.generated.json"
  );
  if (!fs.existsSync(filePath)) return [];

  const snapshot = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  ) as CrmCatalogAddonSnapshot;
  if (!Array.isArray(snapshot.products)) {
    throw new Error("crm-catalog-addons.generated.json nie zawiera tablicy products.");
  }

  return snapshot.products;
}

function buildCrmCoreDescription(product: CrmCoreProduct): string {
  return [
    "Pełny katalog MoonGlass — D4.2",
    "Cena katalogowa: NETTO. VAT jest ustalany na poziomie Deala.",
    product.notes ? `Zakres: ${product.notes}` : "",
    product.source ? `Źródło: ${product.source}` : "",
    "Zarządzane automatycznie — nie zmieniaj kodu SKU ręcznie.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCrmAddonDescription(addon: CrmCatalogAddon): string {
  return [
    "Pełny katalog MoonGlass — D4.2",
    "Zakres: crm_only / konstrukcje niestandardowe",
    "Cena katalogowa: NETTO. VAT jest ustalany na poziomie Deala.",
    "Nie dodawaj tej pozycji do standardowego ogrodu, jeśli element jest już zawarty w kompletnym produkcie OP/OS.",
    addon.notes ? `Uwagi: ${addon.notes}` : "",
    "Zarządzane automatycznie — nie zmieniaj kodu SKU ręcznie.",
  ]
    .filter(Boolean)
    .join("\n");
}


function resolveGeneratedSectionKey(sectionKey: string, family: string): string {
  const byFamily: Record<string, string> = {
    terrace_roof_poly: "terrace_roofs_poly",
    terrace_roof_glass: "terrace_roofs_glass",
    winter_garden_poly: "winter_gardens_poly",
    winter_garden_glass: "winter_gardens_glass",
    installation_terrace_roof: "terrace_roofs_installation",
    installation_winter_garden: "winter_gardens_installation",
    roof_poly_color_surcharge: "roof_poly_colored",
    roof_glass_color_surcharge: "roof_glass_colored",
    wall_glass_tint_surcharge: "walls_tinted",
    led_rgb_cct: "lighting_rgb_cct",

    crm_foundation: "foundation",
    crm_sliding_clear: "sliding_complete",
    crm_sliding_milky_surcharge: "sliding_surcharges",
    crm_sliding_tinted_surcharge: "sliding_surcharges",
    crm_triangle_material: "side_triangles",
    crm_triangle_h_profile: "side_triangles",
    crm_rafter_poly: "service_elements_general",
    crm_rafter_glass: "service_elements_general",
    crm_post: "service_elements_general",
    crm_accessory: "service_elements_general",
  };

  const resolved = byFamily[family];
  if (resolved) return resolved;

  // Zachowujemy kompatybilność z przyszłymi rekordami, ale nie maskujemy
  // znanych rodzin przez nieprecyzyjny sectionKey.
  return sectionKey;
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
    "Zakres: dodatek operacyjny website+crm",
    "Cena katalogowa: NETTO. VAT jest ustalany na poziomie Deala.",
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
