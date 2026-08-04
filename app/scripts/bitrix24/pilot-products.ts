import fs from "node:fs";
import path from "node:path";
import type { ProductBlueprint } from "./types";

interface PricingRow {
  productType: "terrace_roof" | "winter_garden";
  widthCm: number;
  lengthCm: number;
  constructionGross: number;
  wallGlassClearGross: number;
  wallGlassTintedGross: number;
  roofPolycarbonateClearGross: number;
  roofPolycarbonateMilkyGross: number;
  roofPolycarbonateGreyGross: number;
  roofPolycarbonateSmokeGross: number;
  roofGlassClearGross: number;
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
  availability?: { roofGlass?: boolean; ledRgb?: boolean };
}

interface PricingSnapshot {
  metadata: { currency: string; pricingVersion?: string };
  priceMatrix: PricingRow[];
}

interface ProductVariantDefinition {
  field: keyof PricingRow;
  skuPart: string;
  name: string;
  sectionKey: string;
  available?: (row: PricingRow) => boolean;
}

const variants: ProductVariantDefinition[] = [
  { field: "wallGlassClearGross", skuPart: "WALL-CLEAR", name: "Ściany przesuwne bezbarwne", sectionKey: "walls" },
  { field: "wallGlassTintedGross", skuPart: "WALL-TINTED", name: "Ściany przesuwne przyciemniane", sectionKey: "walls" },
  { field: "roofPolycarbonateClearGross", skuPart: "ROOF-POLY-CLEAR", name: "Poliwęglan bezbarwny", sectionKey: "roof_poly" },
  { field: "roofPolycarbonateMilkyGross", skuPart: "ROOF-POLY-MILKY", name: "Poliwęglan mleczny", sectionKey: "roof_poly" },
  { field: "roofPolycarbonateGreyGross", skuPart: "ROOF-POLY-GREY", name: "Poliwęglan szary", sectionKey: "roof_poly" },
  { field: "roofPolycarbonateSmokeGross", skuPart: "ROOF-POLY-SMOKE", name: "Poliwęglan dymiony", sectionKey: "roof_poly" },
  { field: "roofGlassClearGross", skuPart: "ROOF-GLASS-CLEAR", name: "Szkło dachowe bezbarwne", sectionKey: "roof_glass", available: (row) => row.availability?.roofGlass !== false },
  { field: "roofGlassTintedGross", skuPart: "ROOF-GLASS-TINTED", name: "Szkło dachowe przyciemniane", sectionKey: "roof_glass", available: (row) => row.availability?.roofGlass !== false },
  { field: "zipLeftGross", skuPart: "ZIP-LEFT", name: "Roleta ZIP LEWA", sectionKey: "zip" },
  { field: "zipRightGross", skuPart: "ZIP-RIGHT", name: "Roleta ZIP PRAWA", sectionKey: "zip" },
  { field: "zipFrontGross", skuPart: "ZIP-FRONT", name: "Roleta ZIP PRZÓD", sectionKey: "zip" },
  { field: "awningGross", skuPart: "AWNING", name: "Markiza dachowa", sectionKey: "awning" },
  { field: "levelingProfileGross", skuPart: "FOUNDATION", name: "Profil poziomujący / przygotowanie fundamentu", sectionKey: "foundation" },
  { field: "ledSpotGross", skuPart: "LED-POINT", name: "Oświetlenie LED punktowe", sectionKey: "lighting" },
  { field: "ledStripGross", skuPart: "LED-CCT", name: "Oświetlenie LED CCT", sectionKey: "lighting" },
  { field: "brushesGross", skuPart: "BRUSHES", name: "Zestaw szczotek przeciwkurzowych", sectionKey: "accessories" },
  { field: "handlesGross", skuPart: "HANDLES", name: "Zestaw uchwytów", sectionKey: "accessories" },
];

export function buildPilotProducts(
  cwd: string,
  dimensions: string[]
): ProductBlueprint[] {
  const filePath = path.join(
    cwd,
    "src/data/pricing/glass-system/published-pricing.generated.json"
  );
  const snapshot = JSON.parse(fs.readFileSync(filePath, "utf8")) as PricingSnapshot;
  const wanted = new Set(dimensions.map(normalizeDimension));
  const products = new Map<string, ProductBlueprint>();

  for (const row of snapshot.priceMatrix) {
    if (!row.active) continue;
    const dimensionKey = `${row.lengthCm}x${row.widthCm}`;
    if (!wanted.has(dimensionKey)) continue;

    const productPrefix = row.productType === "winter_garden" ? "WG" : "TR";
    const productLabel = row.productType === "winter_garden" ? "Ogród zimowy" : "Zadaszenie tarasu";
    const constructionSection = row.productType === "winter_garden" ? "winter_gardens" : "terrace_roofs";
    const suffix = `D${row.lengthCm}-W${row.widthCm}`;

    if (row.constructionGross > 0) {
      const sku = `MG-${productPrefix}-BASE-${suffix}`;
      products.set(sku, {
        sku,
        name: `${productLabel} ${row.lengthCm}×${row.widthCm} cm`,
        sectionKey: constructionSection,
        priceGross: row.constructionGross,
        currency: snapshot.metadata.currency || "PLN",
        description: `Pilot z cennika ${snapshot.metadata.pricingVersion || "MoonGlass"}`,
      });
    }

    for (const variant of variants) {
      if (variant.available && !variant.available(row)) continue;
      const value = row[variant.field];
      if (typeof value !== "number" || value <= 0) continue;
      const sku = `MG-${variant.skuPart}-${suffix}`;
      if (products.has(sku)) continue;
      products.set(sku, {
        sku,
        name: `${variant.name} ${row.lengthCm}×${row.widthCm} cm`,
        sectionKey: variant.sectionKey,
        priceGross: value,
        currency: snapshot.metadata.currency || "PLN",
        description: `Pilot z cennika ${snapshot.metadata.pricingVersion || "MoonGlass"}`,
      });
    }
  }

  if (products.size === 0) {
    throw new Error(
      `Nie znaleziono aktywnych pozycji dla wymiarów: ${dimensions.join(", ")}. Format: głębokośćxszerokość, np. 300x306.`
    );
  }

  return [...products.values()].sort((a, b) => a.sku.localeCompare(b.sku));
}

function normalizeDimension(value: string): string {
  return value.toLowerCase().replace(/[×\s]/g, "x").replace(/x+/g, "x");
}
