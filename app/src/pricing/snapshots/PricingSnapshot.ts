export const KNOWN_PRICING_PRODUCT_TYPES = [
  "terrace_roof",
  "winter_garden",
  "carport",
] as const;

export const KNOWN_QUOTE_ITEM_CATEGORIES = [
  "construction",
  "roof",
  "walls",
  "zip",
  "awning",
  "lighting",
  "accessory",
  "installation",
] as const;

export type KnownPricingProductType =
  (typeof KNOWN_PRICING_PRODUCT_TYPES)[number];

export type KnownQuoteItemCategory =
  (typeof KNOWN_QUOTE_ITEM_CATEGORIES)[number];

export type PricingSnapshotProductType =
  | KnownPricingProductType
  | (string & {});

export type PricingSnapshotProductFamily =
  | "glass_system"
  | "carport"
  | (string & {});

export type PricingSnapshotQuoteItemCategory =
  | KnownQuoteItemCategory
  | (string & {});

export type PricingSnapshotCurrency = "PLN" | (string & {});

export type PricingSnapshotPriceMode = "gross" | "net";

export interface PricingSnapshot {
  metadata: PricingSnapshotMetadata;
  productTypes: PricingSnapshotProductTypeRecord[];
  dimensions: PricingSnapshotDimension[];
  priceMatrix: PricingSnapshotPriceMatrixRow[];
  vatRules: PricingSnapshotVatRule[];
  bitrixProductMappings: PricingSnapshotBitrixProductMapping[];
}

export interface PricingSnapshotMetadata {
  workbookVersion: string;
  pricingVersion: string;
  currency: PricingSnapshotCurrency;
  defaultPriceMode: PricingSnapshotPriceMode;
  defaultVatRate: number;
  source: string;
  publishedBy: string;
  importedAt: string;
  notes?: string;
}

export interface PricingSnapshotProductTypeRecord {
  productType: PricingSnapshotProductType;
  productName: string;
  productFamily?: PricingSnapshotProductFamily;
  active: boolean;
  notes?: string;
}

export interface PricingSnapshotDimension {
  productType: PricingSnapshotProductType;
  widthCm: number;
  lengthCm: number;
  label: string;
  series?: string;
  active: boolean;
}

export interface PricingSnapshotPriceMatrixRow {
  productType: PricingSnapshotProductType;
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
  ledCobGross: number;

  handlesGross: number;
  brushesGross: number;

  active: boolean;
}

export interface PricingSnapshotVatRule {
  quoteItemCategory: PricingSnapshotQuoteItemCategory;
  vatRate: number;
  taxIncluded: boolean;
  priceMode: PricingSnapshotPriceMode;
  active: boolean;
}

export interface PricingSnapshotBitrixProductMapping {
  quoteItemCategory: PricingSnapshotQuoteItemCategory;
  quoteItemKey: string;
  productType?: PricingSnapshotProductType;
  widthCm?: number;
  lengthCm?: number;
  optionCode?: string;
  bitrixProductId?: number;
  bitrixProductName: string;
  bitrixSectionName?: string;
  vatRate: number;
  taxIncluded: boolean;
  active: boolean;
}

export function createPricingSnapshotDimensionKey(
  productType: PricingSnapshotProductType,
  widthCm: number,
  lengthCm: number
): string {
  return `${productType}:${lengthCm}x${widthCm}`;
}