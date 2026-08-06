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
  expectedNet: 17_632,
  expectedTax: 1_410.56,
  expectedGross: 19_042.56,
  expectedSchedule: [5_712.77, 9_521.28, 3_808.51],
});

verifyScenario({
  label: "osoba prywatna 300×306, VAT 23%",
  configuration: privateConfiguration,
  vatRate: 23,
  expectedNet: 17_632,
  expectedTax: 4_055.36,
  expectedGross: 21_687.36,
  expectedSchedule: [6_506.21, 10_843.68, 4_337.47],
});

verifyScenario({
  label: "firma 350×506, VAT 23%",
  configuration: companyConfiguration,
  vatRate: 23,
  expectedNet: 55_927,
  expectedTax: 12_863.21,
  expectedGross: 68_790.21,
  expectedSchedule: [20_637.06, 34_395.11, 13_758.04],
});

console.log(
  "D6.6.4.1 — kwota Deala i harmonogram 30/50/20 są zgodne z docelową stawką VAT."
);
console.log(
  "VAT 23% dla 55 927,00 PLN netto: VAT 12 863,21 PLN; brutto 68 790,21 PLN; raty 20 637,06 / 34 395,11 / 13 758,04 PLN."
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
