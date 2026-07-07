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
import type {
  PricingSnapshot,
} from "@/pricing/snapshots/PricingSnapshot";
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
    const productType = getProductKind(configuration);

    const criteria: PricingCriteria = {
      productType,
      widthCm: configuration.width,
      lengthCm: configuration.length,
    };

    const items: QuoteItem[] = [];

    this.addItem(items, {
      id: "construction",
      name: "Konstrukcja",
      category: "construction",
      price: this.getPrice(criteria, "constructionGross"),
    });

    this.addItem(items, {
      id: "roof",
      name: "Pokrycie dachu",
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

    const zipPrice = this.calculateZipPrice(configuration, criteria);

    this.addItem(items, {
      id: "zip",
      name: "Rolety ZIP",
      category: "zip",
      price: zipPrice,
    });

    this.addItem(items, {
      id: "awning",
      name: "Markiza",
      category: "awning",
      price: configuration.hasAwning
        ? this.getPrice(criteria, "awningGross")
        : 0,
    });

    const lightingPrice = this.calculateLightingPrice(configuration, criteria);

    this.addItem(items, {
      id: "led",
      name: "Oświetlenie LED",
      category: "lighting",
      price: lightingPrice,
    });

    const accessoriesPrice = this.calculateAccessoriesPrice(
      configuration,
      criteria
    );

    this.addItem(items, {
      id: "accessories",
      name: "Akcesoria",
      category: "accessory",
      price: accessoriesPrice,
    });

    const totalGross = items.reduce(
      (sum, item) => sum + item.totalPriceGross,
      0
    );

    return {
      configuration,
      items,
      totalGross,
      currency: "PLN",
    };
  }

  private addItem(items: QuoteItem[], input: SnapshotQuoteItemInput) {
    if (input.price <= 0) {
      return;
    }

    items.push({
      id: input.id,
      name: input.name,
      category: input.category,
      quantity: 1,
      unitPriceGross: input.price,
      totalPriceGross: input.price,
    });
  }

  private calculateZipPrice(
    configuration: ProductConfiguration,
    criteria: PricingCriteria
  ): number {
    if (configuration.walls === "none") {
      return 0;
    }

    let total = 0;

    if (configuration.hasFrontZip) {
      total += this.getPrice(criteria, "zipFrontGross");
    }

    if (configuration.hasLeftZip) {
      total += this.getPrice(criteria, "zipLeftGross");
    }

    if (configuration.hasRightZip) {
      total += this.getPrice(criteria, "zipRightGross");
    }

    return total;
  }

  private calculateLightingPrice(
    configuration: ProductConfiguration,
    criteria: PricingCriteria
  ): number {
    let total = 0;

    if (configuration.hasLed) {
      total += this.getPrice(criteria, "ledSpotGross");
    }

    if (configuration.hasCob) {
      total += this.getPrice(criteria, "ledCobGross");
    }

    return total;
  }

  private calculateAccessoriesPrice(
    configuration: ProductConfiguration,
    criteria: PricingCriteria
  ): number {
    let total = 0;

    if (configuration.hasHandles) {
      total += this.getPrice(criteria, "handlesGross");
    }

    if (configuration.hasBrushes) {
      total += this.getPrice(criteria, "brushesGross");
    }

    if (configuration.hasLevelingProfile) {
      total += this.getPrice(criteria, "levelingProfileGross");
    }

    return total;
  }

  private getPrice(
    criteria: PricingCriteria,
    field: PricingSnapshotPriceField
  ): number {
    return this.reader.getPrice(
      {
        productType: criteria.productType,
        widthCm: criteria.widthCm,
        lengthCm: criteria.lengthCm,
      },
      field
    );
  }
}

function getRoofPriceField(roof: RoofOption): PricingSnapshotPriceField {
  if (roof === "polycarbonate_clear") {
    return "roofPolycarbonateClearGross";
  }

  if (roof === "polycarbonate_milky") {
    return "roofPolycarbonateMilkyGross";
  }

  if (roof === "polycarbonate_grey") {
    return "roofPolycarbonateGreyGross";
  }

  if (roof === "polycarbonate_smoke") {
    return "roofPolycarbonateSmokeGross";
  }

  if (roof === "glass_clear") {
    return "roofGlassClearGross";
  }

  return "roofGlassMilkyGross";
}

function getWallPriceField(walls: WallOption): PricingSnapshotPriceField {
  if (walls === "glass_clear") {
    return "wallGlassClearGross";
  }

  if (walls === "glass_milky") {
    return "wallGlassMilkyGross";
  }

  return "wallGlassTintedGross";
}