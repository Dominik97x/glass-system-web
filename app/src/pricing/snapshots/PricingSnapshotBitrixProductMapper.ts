import type {
  PricingSnapshot,
  PricingSnapshotBitrixProductMapping,
  PricingSnapshotPriceMode,
  PricingSnapshotProductType,
  PricingSnapshotQuoteItemCategory,
  PricingSnapshotVatRule,
} from "./PricingSnapshot";
import {
  calculateTaxForPrice,
  type PricingSnapshotTaxCalculation,
} from "./PricingSnapshotTaxCalculator";

export interface PricingSnapshotBitrixProductMappingCriteria {
  quoteItemCategory: PricingSnapshotQuoteItemCategory;
  quoteItemKey: string;
  productType?: PricingSnapshotProductType;
  widthCm?: number;
  lengthCm?: number;
  optionCode?: string;
}

export interface PricingSnapshotPreparedBitrixProductRow {
  productId?: number;
  productName: string;
  priceNet: number;
  priceGross: number;
  taxAmount: number;
  vatRate: number;
  taxIncluded: false;
  quantity: number;
  sort: number;
  sourcePrice: number;
  sourceTaxIncluded: boolean;
  sourceMapping: PricingSnapshotBitrixProductMapping;
}

export class PricingSnapshotBitrixProductMappingNotFoundError extends Error {
  constructor(
    public readonly criteria: PricingSnapshotBitrixProductMappingCriteria
  ) {
    super(
      `Bitrix24 product mapping not found for ${createCriteriaDebugLabel(
        criteria
      )}`
    );
    this.name = "PricingSnapshotBitrixProductMappingNotFoundError";
  }
}

export class PricingSnapshotBitrixProductMapper {
  constructor(private readonly snapshot: PricingSnapshot) {}

  findActiveMapping(
    criteria: PricingSnapshotBitrixProductMappingCriteria
  ): PricingSnapshotBitrixProductMapping | null {
    const matchingMappings = this.snapshot.bitrixProductMappings
      .filter((mapping) => mapping.active)
      .filter((mapping) => isMappingMatchingCriteria(mapping, criteria))
      .sort(
        (left, right) =>
          getMappingSpecificityScore(right) - getMappingSpecificityScore(left)
      );

    return matchingMappings[0] ?? null;
  }

  getActiveMapping(
    criteria: PricingSnapshotBitrixProductMappingCriteria
  ): PricingSnapshotBitrixProductMapping {
    const mapping = this.findActiveMapping(criteria);

    if (!mapping) {
      throw new PricingSnapshotBitrixProductMappingNotFoundError(criteria);
    }

    return mapping;
  }

  prepareProductRow(
    criteria: PricingSnapshotBitrixProductMappingCriteria,
    sourcePrice: number,
    quantity: number,
    sort: number
  ): PricingSnapshotPreparedBitrixProductRow {
    const mapping = this.getActiveMapping(criteria);
    const vatRule = createVatRuleFromMapping(mapping);
    const taxCalculation = calculateTaxForPrice(sourcePrice, vatRule);

    return createPreparedProductRow(
      mapping,
      sourcePrice,
      taxCalculation,
      quantity,
      sort
    );
  }
}

function createPreparedProductRow(
  mapping: PricingSnapshotBitrixProductMapping,
  sourcePrice: number,
  taxCalculation: PricingSnapshotTaxCalculation,
  quantity: number,
  sort: number
): PricingSnapshotPreparedBitrixProductRow {
  return {
    productId: mapping.bitrixProductId,
    productName: mapping.bitrixProductName,
    priceNet: taxCalculation.net,
    priceGross: taxCalculation.gross,
    taxAmount: taxCalculation.taxAmount,
    vatRate: taxCalculation.vatRate,
    taxIncluded: false,
    quantity,
    sort,
    sourcePrice,
    sourceTaxIncluded: mapping.taxIncluded,
    sourceMapping: mapping,
  };
}

function createVatRuleFromMapping(
  mapping: PricingSnapshotBitrixProductMapping
): PricingSnapshotVatRule {
  return {
    quoteItemCategory: mapping.quoteItemCategory,
    vatRate: mapping.vatRate,
    taxIncluded: mapping.taxIncluded,
    priceMode: getPriceModeFromTaxIncluded(mapping.taxIncluded),
    active: true,
  };
}

function getPriceModeFromTaxIncluded(
  taxIncluded: boolean
): PricingSnapshotPriceMode {
  return taxIncluded ? "gross" : "net";
}

function isMappingMatchingCriteria(
  mapping: PricingSnapshotBitrixProductMapping,
  criteria: PricingSnapshotBitrixProductMappingCriteria
): boolean {
  if (mapping.quoteItemCategory !== criteria.quoteItemCategory) {
    return false;
  }

  if (mapping.quoteItemKey !== criteria.quoteItemKey) {
    return false;
  }

  return (
    isOptionalValueMatching(mapping.productType, criteria.productType) &&
    isOptionalValueMatching(mapping.widthCm, criteria.widthCm) &&
    isOptionalValueMatching(mapping.lengthCm, criteria.lengthCm) &&
    isOptionalValueMatching(mapping.optionCode, criteria.optionCode)
  );
}

function isOptionalValueMatching<T>(
  mappingValue: T | undefined,
  criteriaValue: T | undefined
): boolean {
  if (mappingValue === undefined) {
    return true;
  }

  return mappingValue === criteriaValue;
}

function getMappingSpecificityScore(
  mapping: PricingSnapshotBitrixProductMapping
): number {
  return [
    mapping.productType,
    mapping.widthCm,
    mapping.lengthCm,
    mapping.optionCode,
  ].filter((value) => value !== undefined).length;
}

function createCriteriaDebugLabel(
  criteria: PricingSnapshotBitrixProductMappingCriteria
): string {
  return [
    criteria.quoteItemCategory,
    criteria.quoteItemKey,
    criteria.productType ?? "*",
    criteria.lengthCm?.toString() ?? "*",
    criteria.widthCm?.toString() ?? "*",
    criteria.optionCode ?? "*",
  ].join(":");
}