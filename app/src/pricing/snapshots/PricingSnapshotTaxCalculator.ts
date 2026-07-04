import type { PricingSnapshotVatRule } from "./PricingSnapshot";

export interface PricingSnapshotTaxCalculation {
  gross: number;
  net: number;
  taxAmount: number;
  vatRate: number;
  taxIncluded: boolean;
}

export function calculateTaxFromGross(
  gross: number,
  vatRate: number
): PricingSnapshotTaxCalculation {
  assertValidMoneyAmount(gross, "gross");
  assertValidVatRate(vatRate);

  const divisor = 1 + vatRate / 100;
  const net = roundMoney(gross / divisor);
  const taxAmount = roundMoney(gross - net);

  return {
    gross: roundMoney(gross),
    net,
    taxAmount,
    vatRate,
    taxIncluded: true,
  };
}

export function calculateTaxFromNet(
  net: number,
  vatRate: number
): PricingSnapshotTaxCalculation {
  assertValidMoneyAmount(net, "net");
  assertValidVatRate(vatRate);

  const taxAmount = roundMoney(net * (vatRate / 100));
  const gross = roundMoney(net + taxAmount);

  return {
    gross,
    net: roundMoney(net),
    taxAmount,
    vatRate,
    taxIncluded: false,
  };
}

export function calculateTaxForPrice(
  price: number,
  vatRule: PricingSnapshotVatRule
): PricingSnapshotTaxCalculation {
  if (vatRule.priceMode === "gross" || vatRule.taxIncluded) {
    return calculateTaxFromGross(price, vatRule.vatRate);
  }

  return calculateTaxFromNet(price, vatRule.vatRate);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertValidMoneyAmount(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative finite number.`);
  }
}

function assertValidVatRate(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("VAT rate must be a number between 0 and 100.");
  }
}