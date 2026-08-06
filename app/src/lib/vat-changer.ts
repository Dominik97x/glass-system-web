import {
  calculatePaymentSchedule305020,
  type PaymentSchedule305020,
} from "./payment-schedule";

export const STANDARD_POLISH_VAT_RATES = [0, 5, 8, 23] as const;

export interface VatProductRowInput {
  index: number;
  productName: string;
  unitGross: number;
  unitNet?: number;
  quantity: number;
  currentVatRate: number;
}

export interface VatProductRowPreview extends VatProductRowInput {
  unitNet: number;
  currentVatAmount: number;
  newVatRate: number;
  newUnitGross: number;
  newVatAmount: number;
  currentRowGross: number;
  newRowGross: number;
}

export interface VatChangePreview {
  newVatRate: number;
  rows: VatProductRowPreview[];
  totals: {
    currentNet: number;
    currentVat: number;
    currentGross: number;
    newNet: number;
    newVat: number;
    newGross: number;
  };
  paymentSchedule: PaymentSchedule305020;
}

export function validateVatRate(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Stawka VAT musi być liczbą.");
  }
  if (value < 0 || value > 100) {
    throw new Error("Stawka VAT musi mieścić się w zakresie od 0 do 100%.");
  }
  return roundRate(value);
}

export function isStandardPolishVatRate(value: number): boolean {
  const rate = roundRate(value);
  return STANDARD_POLISH_VAT_RATES.some((candidate) => candidate === rate);
}

export function calculateVatChangePreservingNet(
  rows: VatProductRowInput[],
  newVatRateInput: number
): VatChangePreview {
  const newVatRate = validateVatRate(newVatRateInput);

  if (rows.length === 0) {
    throw new Error("Deal nie ma pozycji produktowych do przeliczenia.");
  }

  const previews = rows.map((row) => {
    const quantity = assertPositive(row.quantity, "Ilość");
    const currentVatRate = validateVatRate(row.currentVatRate);
    const unitNet =
      row.unitNet === undefined
        ? roundMoney(
            assertNonNegative(row.unitGross, "Cena brutto") /
              (1 + currentVatRate / 100)
          )
        : roundMoney(assertNonNegative(row.unitNet, "Cena netto"));
    const unitGross =
      row.unitNet === undefined
        ? roundMoney(assertNonNegative(row.unitGross, "Cena brutto"))
        : roundMoney(unitNet * (1 + currentVatRate / 100));
    const newUnitGross = roundMoney(unitNet * (1 + newVatRate / 100));
    const currentRowGross = roundMoney(unitGross * quantity);
    const newRowGross = roundMoney(newUnitGross * quantity);

    return {
      ...row,
      unitGross,
      quantity,
      currentVatRate,
      unitNet,
      currentVatAmount: roundMoney(unitGross - unitNet),
      newVatRate,
      newUnitGross,
      newVatAmount: roundMoney(newUnitGross - unitNet),
      currentRowGross,
      newRowGross,
    };
  });

  const currentNet = sumMoney(
    previews.map((row) => roundMoney(row.unitNet * row.quantity))
  );
  const currentGross = sumMoney(previews.map((row) => row.currentRowGross));
  const newNet = currentNet;
  const newGross = sumMoney(previews.map((row) => row.newRowGross));

  return {
    newVatRate,
    rows: previews,
    totals: {
      currentNet,
      currentVat: roundMoney(currentGross - currentNet),
      currentGross,
      newNet,
      newVat: roundMoney(newGross - newNet),
      newGross,
    },
    paymentSchedule: calculatePaymentSchedule305020(newGross),
  };
}

export function formatVatChangeSummary(preview: VatChangePreview): string {
  return [
    `VAT: ${formatRateList(preview.rows.map((row) => row.currentVatRate))} → ${preview.newVatRate}%`,
    "Tryb: zachowaj ceny netto",
    `Netto: ${preview.totals.newNet.toFixed(2)} PLN`,
    `VAT: ${preview.totals.newVat.toFixed(2)} PLN`,
    `Brutto: ${preview.totals.currentGross.toFixed(2)} → ${preview.totals.newGross.toFixed(2)} PLN`,
    `Raty 30/50/20: ${preview.paymentSchedule.stage1Amount.toFixed(2)} / ${preview.paymentSchedule.stage2Amount.toFixed(2)} / ${preview.paymentSchedule.stage3Amount.toFixed(2)} PLN`,
  ].join("\n");
}

function formatRateList(values: number[]): string {
  const unique = [...new Set(values.map(roundRate))].sort((a, b) => a - b);
  return unique.map((value) => `${value}%`).join(", ");
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((sum, value) => sum + value, 0));
}

function assertPositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} musi być liczbą większą od zera.`);
  }
  return value;
}

function assertNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} musi być liczbą nieujemną.`);
  }
  return value;
}
