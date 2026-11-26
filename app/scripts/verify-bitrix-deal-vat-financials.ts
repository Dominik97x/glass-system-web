import type { ProductConfiguration } from "../src/domain/ProductConfiguration";
import {
  createQuoteSnapshot,
  recalculateQuoteSnapshotForVat,
} from "../src/lib/quote-snapshot";
import { calculatePaymentSchedule305020 } from "../src/lib/payment-schedule";
import { QuoteService } from "../src/pricing/services/QuoteService";

const privateConfiguration: ProductConfiguration = {
  width: 306,
  length: 300,
  walls: "none",
  roof: "polycarbonate_clear",
  hasFrontZip: true,
  hasLeftZip: false,
  hasRightZip: false,
  hasAwning: true,
  hasLed: false,
  hasCob: true,
  hasHandles: true,
  hasBrushes: true,
  hasLevelingProfile: true,
};

const companyConfiguration: ProductConfiguration = {
  width: 506,
  length: 350,
  walls: "glass_clear",
  roof: "glass_tinted",
  hasFrontZip: true,
  hasLeftZip: true,
  hasRightZip: true,
  hasAwning: true,
  hasLed: false,
  hasCob: true,
  hasHandles: true,
  hasBrushes: true,
  hasLevelingProfile: true,
};

verifyScenario({
  label: "osoba prywatna 300×306, VAT 8%",
  configuration: privateConfiguration,
  vatRate: 8,
  expectedNet: 20_498,
  expectedTax: 1_639.84,
  expectedGross: 22_137.84,
  expectedSchedule: [6_641.35, 11_068.92, 4_427.57],
});

verifyScenario({
  label: "osoba prywatna 300×306, VAT 23%",
  configuration: privateConfiguration,
  vatRate: 23,
  expectedNet: 20_498,
  expectedTax: 4_714.54,
  expectedGross: 25_212.54,
  expectedSchedule: [7_563.76, 12_606.27, 5_042.51],
});

verifyScenario({
  label: "firma 350×506, VAT 23%",
  configuration: companyConfiguration,
  vatRate: 23,
  // Complete glass garden + separate installation + tint + 3 ZIPs +
  // awning + CCT + foundation + brushes + handles (no separate carriers).
  expectedNet: 60_898,
  expectedTax: 14_006.54,
  expectedGross: 74_904.54,
  expectedSchedule: [22_471.36, 37_452.27, 14_980.91],
});

console.log(
  "D6.6.4.1 — kwota Deala i harmonogram 30/50/20 są zgodne z docelową stawką VAT."
);
console.log(
  "VAT 23% dla 60 898,00 PLN netto: VAT 14 006,54 PLN; brutto 74 904,54 PLN; raty 22 471,36 / 37 452,27 / 14 980,91 PLN."
);

function verifyScenario(input: {
  label: string;
  configuration: ProductConfiguration;
  vatRate: number;
  expectedNet: number;
  expectedTax: number;
  expectedGross: number;
  expectedSchedule: readonly [number, number, number];
}): void {
  const quote = new QuoteService().createQuote(input.configuration);
  const snapshot = createQuoteSnapshot(quote);
  const financials = recalculateQuoteSnapshotForVat(snapshot, input.vatRate);

  if (!financials) {
    throw new Error(`Brak snapshotu finansowego v2: ${input.label}.`);
  }

  assertMoney(financials.totalNet, input.expectedNet, `${input.label}: netto`);
  assertMoney(
    financials.totalTaxAmount,
    input.expectedTax,
    `${input.label}: VAT`
  );
  assertMoney(
    financials.totalGross,
    input.expectedGross,
    `${input.label}: brutto`
  );

  const schedule = calculatePaymentSchedule305020(financials.totalGross);
  assertMoney(
    schedule.stage1Amount,
    input.expectedSchedule[0],
    `${input.label}: I rata`
  );
  assertMoney(
    schedule.stage2Amount,
    input.expectedSchedule[1],
    `${input.label}: II rata`
  );
  assertMoney(
    schedule.stage3Amount,
    input.expectedSchedule[2],
    `${input.label}: III rata`
  );
  assertMoney(
    schedule.stage1Amount + schedule.stage2Amount + schedule.stage3Amount,
    input.expectedGross,
    `${input.label}: suma rat`
  );
}

function assertMoney(actual: number, expected: number, label: string): void {
  if (roundMoney(actual) !== roundMoney(expected)) {
    throw new Error(
      `Nie zaliczono kontroli „${label}”: oczekiwano ${expected.toFixed(
        2
      )}, otrzymano ${actual.toFixed(2)}.`
    );
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
