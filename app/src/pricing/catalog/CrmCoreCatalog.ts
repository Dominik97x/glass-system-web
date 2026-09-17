import generatedCrmCoreProducts from "@/data/pricing/glass-system/crm-core-products.generated.json";

export type CrmCoreProductFamily =
  | "terrace_roof_poly"
  | "terrace_roof_glass"
  | "winter_garden_poly"
  | "winter_garden_glass"
  | "installation_terrace_roof"
  | "installation_winter_garden"
  | "roof_poly_color_surcharge"
  | "roof_glass_color_surcharge"
  | "wall_glass_tint_surcharge"
  | "led_rgb_cct";

export interface CrmCoreProduct {
  sku: string;
  name: string;
  sectionKey: string;
  family: CrmCoreProductFamily;
  dimensionKey: string;
  priceNet: number;
  currency: string;
  sort: number;
  source?: string;
  notes?: string;
}

interface CrmCoreProductSnapshot {
  products: CrmCoreProduct[];
}

const snapshot = generatedCrmCoreProducts as CrmCoreProductSnapshot;
const productsByKey = new Map<string, CrmCoreProduct>();

for (const product of snapshot.products) {
  const key = createKey(product.family, product.dimensionKey);
  if (productsByKey.has(key)) {
    throw new Error(`Zduplikowany produkt katalogowy D4.2: ${key}.`);
  }
  productsByKey.set(key, product);
}

export function getCrmCoreProduct(
  family: CrmCoreProductFamily,
  lengthCm: number,
  widthCm: number
): CrmCoreProduct {
  const dimensionKey = `${lengthCm}x${widthCm}`;
  const product = productsByKey.get(createKey(family, dimensionKey));

  if (!product) {
    throw new Error(
      `Brak produktu katalogowego D4.2 dla ${family} ${lengthCm}×${widthCm} cm.`
    );
  }

  if (!Number.isFinite(product.priceNet) || product.priceNet <= 0) {
    throw new Error(
      `Nieprawidłowa cena netto produktu ${product.sku}: ${String(product.priceNet)}.`
    );
  }

  return product;
}

function createKey(
  family: CrmCoreProductFamily,
  dimensionKey: string
): string {
  return `${family}:${dimensionKey}`;
}
