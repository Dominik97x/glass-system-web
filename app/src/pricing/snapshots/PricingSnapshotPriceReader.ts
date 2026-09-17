import {
  createPricingSnapshotDimensionKey,
  type PricingSnapshot,
  type PricingSnapshotPriceMatrixRow,
  type PricingSnapshotProductType,
  type PricingSnapshotQuoteItemCategory,
  type PricingSnapshotVatRule,
} from "./PricingSnapshot";

export const PRICING_SNAPSHOT_NET_PRICE_FIELDS = [
  "constructionNet",
  "wallGlassClearNet",
  "wallGlassMilkyNet",
  "wallGlassTintedNet",
  "roofPolycarbonateClearNet",
  "roofPolycarbonateMilkyNet",
  "roofPolycarbonateGreyNet",
  "roofPolycarbonateSmokeNet",
  "roofGlassClearNet",
  "roofGlassMilkyNet",
  "roofGlassTintedNet",
  "zipRightNet",
  "zipLeftNet",
  "zipFrontNet",
  "awningNet",
  "levelingProfileNet",
  "ledSpotNet",
  "ledStripNet",
  "ledCobNet",
  "handlesNet",
  "brushesNet",
] as const satisfies ReadonlyArray<keyof PricingSnapshotPriceMatrixRow>;

export const PRICING_SNAPSHOT_GROSS_PRICE_FIELDS = [
  "constructionGross",
  "wallGlassClearGross",
  "wallGlassMilkyGross",
  "wallGlassTintedGross",
  "roofPolycarbonateClearGross",
  "roofPolycarbonateMilkyGross",
  "roofPolycarbonateGreyGross",
  "roofPolycarbonateSmokeGross",
  "roofGlassClearGross",
  "roofGlassMilkyGross",
  "roofGlassTintedGross",
  "zipRightGross",
  "zipLeftGross",
  "zipFrontGross",
  "awningGross",
  "levelingProfileGross",
  "ledSpotGross",
  "ledStripGross",
  "ledCobGross",
  "handlesGross",
  "brushesGross",
] as const satisfies ReadonlyArray<keyof PricingSnapshotPriceMatrixRow>;

export const PRICING_SNAPSHOT_PRICE_FIELDS = [
  ...PRICING_SNAPSHOT_NET_PRICE_FIELDS,
  ...PRICING_SNAPSHOT_GROSS_PRICE_FIELDS,
] as const;

export type PricingSnapshotNetPriceField =
  (typeof PRICING_SNAPSHOT_NET_PRICE_FIELDS)[number];
export type PricingSnapshotGrossPriceField =
  (typeof PRICING_SNAPSHOT_GROSS_PRICE_FIELDS)[number];
export type PricingSnapshotPriceField =
  (typeof PRICING_SNAPSHOT_PRICE_FIELDS)[number];

export interface PricingSnapshotPriceMatrixCriteria {
  productType: PricingSnapshotProductType;
  widthCm: number;
  lengthCm: number;
}

export class PricingSnapshotPriceMatrixRowNotFoundError extends Error {
  constructor(public readonly criteria: PricingSnapshotPriceMatrixCriteria) {
    super(
      `Price matrix row not found for ${criteria.productType}:${criteria.lengthCm}x${criteria.widthCm}`
    );
    this.name = "PricingSnapshotPriceMatrixRowNotFoundError";
  }
}

export class PricingSnapshotVatRuleNotFoundError extends Error {
  constructor(public readonly quoteItemCategory: PricingSnapshotQuoteItemCategory) {
    super(`VAT rule not found for category "${quoteItemCategory}"`);
    this.name = "PricingSnapshotVatRuleNotFoundError";
  }
}

export class PricingSnapshotPriceReader {
  constructor(private readonly snapshot: PricingSnapshot) {}

  findActivePriceMatrixRow(
    criteria: PricingSnapshotPriceMatrixCriteria
  ): PricingSnapshotPriceMatrixRow | null {
    return (
      this.snapshot.priceMatrix.find(
        (row) =>
          row.active &&
          row.productType === criteria.productType &&
          row.widthCm === criteria.widthCm &&
          row.lengthCm === criteria.lengthCm
      ) ?? null
    );
  }

  getActivePriceMatrixRow(
    criteria: PricingSnapshotPriceMatrixCriteria
  ): PricingSnapshotPriceMatrixRow {
    const row = this.findActivePriceMatrixRow(criteria);

    if (!row) {
      throw new PricingSnapshotPriceMatrixRowNotFoundError(criteria);
    }

    return row;
  }

  hasActivePriceMatrixRow(
    criteria: PricingSnapshotPriceMatrixCriteria
  ): boolean {
    return this.findActivePriceMatrixRow(criteria) !== null;
  }

  getPrice(
    criteria: PricingSnapshotPriceMatrixCriteria,
    field: PricingSnapshotPriceField
  ): number {
    const row = this.getActivePriceMatrixRow(criteria);
    return Number(row[field] ?? 0);
  }

  sumPrices(
    criteria: PricingSnapshotPriceMatrixCriteria,
    fields: PricingSnapshotPriceField[]
  ): number {
    const row = this.getActivePriceMatrixRow(criteria);
    return sumPricingSnapshotPriceFields(row, fields);
  }

  findActiveVatRule(
    quoteItemCategory: PricingSnapshotQuoteItemCategory
  ): PricingSnapshotVatRule | null {
    return (
      this.snapshot.vatRules.find(
        (rule) => rule.active && rule.quoteItemCategory === quoteItemCategory
      ) ?? null
    );
  }

  getActiveVatRule(
    quoteItemCategory: PricingSnapshotQuoteItemCategory
  ): PricingSnapshotVatRule {
    const rule = this.findActiveVatRule(quoteItemCategory);

    if (!rule) {
      throw new PricingSnapshotVatRuleNotFoundError(quoteItemCategory);
    }

    return rule;
  }

  getActiveDimensionKeys(): string[] {
    return this.snapshot.dimensions
      .filter((dimension) => dimension.active)
      .map((dimension) =>
        createPricingSnapshotDimensionKey(
          dimension.productType,
          dimension.widthCm,
          dimension.lengthCm
        )
      );
  }
}

export function sumPricingSnapshotPriceFields(
  row: PricingSnapshotPriceMatrixRow,
  fields: PricingSnapshotPriceField[]
): number {
  return fields.reduce((sum, field) => sum + Number(row[field] ?? 0), 0);
}
