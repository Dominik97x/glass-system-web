import generatedPricingSnapshot from "@/data/pricing/glass-system/published-pricing.generated.json";
import {
  getProductKind,
  type ProductConfiguration,
  type ProductKind,
  type RoofOption,
  type WallOption,
} from "@/domain/ProductConfiguration";
import type { Quote } from "@/domain/Quote";
import type { QuoteItem } from "@/domain/QuoteItem";
import type { PricingSnapshot } from "@/pricing/snapshots/PricingSnapshot";
import {
  PricingSnapshotPriceReader,
  type PricingSnapshotPriceField,
} from "@/pricing/snapshots/PricingSnapshotPriceReader";
import { validatePricingSnapshot } from "@/pricing/snapshots/PricingSnapshotValidator";

interface SnapshotQuoteItemInput {
  id: string;
  name: string;
  category: QuoteItem["category"];
  price: number;
}

interface PricingCriteria {
  productType: ProductKind;
  widthCm: number;
  lengthCm: number;
}

const snapshot = generatedPricingSnapshot as PricingSnapshot;

export class SnapshotQuoteService {
  private readonly reader: PricingSnapshotPriceReader;

  constructor() {
    const validation = validatePricingSnapshot(snapshot);
    if (!validation.success) {
      throw new Error(
        `Generated pricing snapshot is invalid: ${validation.errors
          .map((issue) => issue.message)
          .join(", ")}`
      );
    }
    this.reader = new PricingSnapshotPriceReader(snapshot);
  }

  createQuote(configuration: ProductConfiguration): Quote {
    assertPriceableConfiguration(configuration);

    const criteria: PricingCriteria = {
      productType: getProductKind(configuration),
      widthCm: configuration.width,
      lengthCm: configuration.length,
    };
    const items: QuoteItem[] = [];

    this.addItem(items, {
      id: "construction",
      name: "Konstrukcja z dachem poliwęglanowym",
      category: "construction",
      price: this.getPrice(criteria, "constructionGross"),
    });

    this.addItem(items, {
      id: "roof",
      name: "Dopłata do wariantu dachu",
      category: "roof",
      price: this.getPrice(criteria, getRoofPriceField(configuration.roof)),
    });

    if (configuration.walls !== "none") {
      this.addItem(items, {
        id: "walls",
        name: "Ściany przesuwne",
        category: "walls",
        price: this.getPrice(criteria, getWallPriceField(configuration.walls)),
      });
    }

    let zipPrice = 0;
    if (configuration.hasFrontZip) zipPrice += this.getPrice(criteria, "zipFrontGross");
    if (configuration.hasLeftZip) zipPrice += this.getPrice(criteria, "zipLeftGross");
    if (configuration.hasRightZip) zipPrice += this.getPrice(criteria, "zipRightGross");
    this.addItem(items, { id: "zip", name: "Rolety ZIP", category: "zip", price: zipPrice });

    this.addItem(items, {
      id: "awning",
      name: "Markiza",
      category: "awning",
      price: configuration.hasAwning ? this.getPrice(criteria, "awningGross") : 0,
    });

    const lightingPrice = configuration.hasLed
      ? this.getPrice(criteria, "ledSpotGross")
      : configuration.hasCob
        ? this.getPrice(criteria, "ledStripGross")
        : 0;
    this.addItem(items, {
      id: "led",
      name: configuration.hasCob ? "Oświetlenie LED CCT" : "Oświetlenie LED punktowe",
      category: "lighting",
      price: lightingPrice,
    });

    let accessoriesPrice = 0;
    if (configuration.hasHandles) accessoriesPrice += this.getPrice(criteria, "handlesGross");
    if (configuration.hasBrushes) accessoriesPrice += this.getPrice(criteria, "brushesGross");
    if (configuration.hasLevelingProfile) accessoriesPrice += this.getPrice(criteria, "levelingProfileGross");
    this.addItem(items, {
      id: "accessories",
      name: "Akcesoria",
      category: "accessory",
      price: accessoriesPrice,
    });

    return {
      configuration,
      items,
      totalGross: items.reduce((sum, item) => sum + item.totalPriceGross, 0),
      currency: "PLN",
    };
  }

  private addItem(items: QuoteItem[], input: SnapshotQuoteItemInput) {
    if (input.price <= 0) return;
    items.push({
      id: input.id,
      name: input.name,
      category: input.category,
      quantity: 1,
      unitPriceGross: input.price,
      totalPriceGross: input.price,
    });
  }

  private getPrice(criteria: PricingCriteria, field: PricingSnapshotPriceField): number {
    return this.reader.getPrice(criteria, field);
  }
}

function assertPriceableConfiguration(
  configuration: ProductConfiguration
): void {
  if (configuration.hasLed && configuration.hasCob) {
    throw new Error(
      "LED punktowe i LED CCT nie mogą być wybrane jednocześnie."
    );
  }

  if (configuration.length >= 550 && configuration.roof.startsWith("glass_")) {
    throw new Error(
      "Dach szklany dla długości 550 i 600 cm wymaga wyceny indywidualnej."
    );
  }

  if (
    configuration.roof === "glass_milky" ||
    configuration.walls === "glass_milky"
  ) {
    throw new Error("Wybrany wariant szkła nie jest publikowany na stronie.");
  }
}

function getRoofPriceField(roof: RoofOption): PricingSnapshotPriceField {
  if (roof === "polycarbonate_clear") return "roofPolycarbonateClearGross";
  if (roof === "polycarbonate_milky") return "roofPolycarbonateMilkyGross";
  if (roof === "polycarbonate_grey") return "roofPolycarbonateGreyGross";
  if (roof === "polycarbonate_smoke") return "roofPolycarbonateSmokeGross";
  if (roof === "glass_clear") return "roofGlassClearGross";
  if (roof === "glass_milky") return "roofGlassMilkyGross";
  return "roofGlassTintedGross";
}

function getWallPriceField(walls: WallOption): PricingSnapshotPriceField {
  if (walls === "glass_clear") return "wallGlassClearGross";
  if (walls === "glass_milky") return "wallGlassMilkyGross";
  return "wallGlassTintedGross";
}
