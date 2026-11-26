import type { ProductConfiguration } from "../src/domain/ProductConfiguration";
import {
  createQuoteSnapshot,
  hasDetailedQuoteFinancials,
} from "../src/lib/quote-snapshot";
import { QuoteService } from "../src/pricing/services/QuoteService";

const configuration: ProductConfiguration = {
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

const quote = new QuoteService().createQuote(configuration);
const snapshot = createQuoteSnapshot(quote);

if (!hasDetailedQuoteFinancials(snapshot)) {
  throw new Error("Nie utworzono snapshotu finansowego v2.");
}

assertEqual(snapshot.version, 2, "wersja snapshotu");
assertEqual(snapshot.priceMode, "net", "tryb ceny");
assertEqual(snapshot.taxIncluded, false, "VAT niewliczony w cenę netto");
assertEqual(snapshot.items.length, 8, "liczba szczegółowych pozycji");
assertEqual(snapshot.websiteItems.length, 6, "liczba grup widocznych na stronie");
assertEqual(snapshot.defaultVatRate, 8, "domyślna stawka VAT");
assertMoney(snapshot.totalNet, 20498, "suma netto");
assertMoney(snapshot.totalTaxAmount, 1639.84, "suma VAT");
assertMoney(snapshot.totalGross, 22137.84, "dokładna suma brutto");
assertMoney(snapshot.websiteTotalGross, 22137.84, "suma pokazywana na stronie");


const expectedItemIds = [
  "MG-TR-BASE-D300-W306",
  "MG-INSTALL-TR-D300-W306",
  "MG-ZIP-FRONT-D300-W306",
  "MG-AWNING-D300-W306",
  "MG-LED-CCT-D300-W306",
  "MG-FOUNDATION-D300-W306",
  "MG-BRUSHES-D300-W306",
  "MG-HANDLES-D300-W306",
];
assertEqual(
  snapshot.items.map((item) => item.id).join(","),
  expectedItemIds.join(","),
  "kolejność szczegółowych pozycji"
);


const expectedNetBySku: Record<string, number> = {
  "MG-TR-BASE-D300-W306": 5971,
  "MG-INSTALL-TR-D300-W306": 2933,
  "MG-ZIP-FRONT-D300-W306": 2784,
  "MG-AWNING-D300-W306": 5073,
  "MG-LED-CCT-D300-W306": 1669,
  "MG-FOUNDATION-D300-W306": 1240,
  "MG-BRUSHES-D300-W306": 435,
  "MG-HANDLES-D300-W306": 393,
};

for (const item of snapshot.items) {
  const expectedNet = expectedNetBySku[item.id];

  if (expectedNet === undefined) {
    throw new Error("Unexpected SKU: " + item.id);
  }

  assertMoney(
    item.totalPriceNet,
    expectedNet,
    item.id + " NET"
  );

  assertMoney(
    item.totalTaxAmount,
    roundMoney(expectedNet * 0.08),
    item.id + " VAT"
  );

  assertMoney(
    item.totalPriceGross,
    roundMoney(expectedNet * 1.08),
    item.id + " GROSS"
  );

  assertEqual(
    item.vatRate,
    8,
    item.id + " VAT RATE"
  );

  assertEqual(
    item.taxIncluded,
    false,
    item.id + " TAX INCLUDED"
  );
}

const construction = snapshot.items.find((item) => item.id === "MG-TR-BASE-D300-W306");
if (!construction) {
  throw new Error("Brak pozycji construction w snapshotcie.");
}

assertMoney(construction.totalPriceNet, 5971, "konstrukcja netto");
assertMoney(construction.totalTaxAmount, 477.68, "konstrukcja VAT");
assertMoney(construction.totalPriceGross, 6448.68, "konstrukcja brutto");
assertMoney(
  construction.websiteTotalPriceGross,
  6448.68,
  "konstrukcja brutto na stronie"
);
assertEqual(construction.vatRate, 8, "VAT konstrukcji");
assertEqual(construction.taxIncluded, false, "VAT konstrukcji niewliczony");

const itemNet = roundMoney(
  snapshot.items.reduce((sum, item) => sum + (item.totalPriceNet ?? 0), 0)
);
const itemTax = roundMoney(
  snapshot.items.reduce((sum, item) => sum + (item.totalTaxAmount ?? 0), 0)
);
const itemGross = roundMoney(
  snapshot.items.reduce((sum, item) => sum + item.totalPriceGross, 0)
);

assertMoney(itemNet, snapshot.totalNet, "pozycje sumują się do netto");
assertMoney(itemTax, snapshot.totalTaxAmount, "pozycje sumują się do VAT");
assertMoney(itemGross, snapshot.totalGross, "pozycje sumują się do brutto");

console.log(
  "D6.6.3 — snapshot zapytania netto/VAT/brutto zweryfikowany poprawnie."
);
console.log(
  `Netto ${snapshot.totalNet.toFixed(2)} PLN; VAT ${snapshot.defaultVatRate}% ${snapshot.totalTaxAmount.toFixed(2)} PLN; brutto ${snapshot.totalGross.toFixed(2)} PLN.`
);
console.log(
  `Aktualna cena strony: około ${snapshot.websiteTotalGross.toFixed(2)} PLN brutto.`
);
console.log(
  `Pierwsza pozycja: netto ${construction.totalPriceNet?.toFixed(2)} PLN; VAT ${construction.totalTaxAmount?.toFixed(2)} PLN; brutto ${construction.totalPriceGross.toFixed(2)} PLN.`
);

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `Nie zaliczono kontroli „${label}”: oczekiwano ${String(
        expected
      )}, otrzymano ${String(actual)}.`
    );
  }
}

function assertMoney(
  actual: number | undefined,
  expected: number,
  label: string
): void {
  if (typeof actual !== "number" || roundMoney(actual) !== roundMoney(expected)) {
    throw new Error(
      `Nie zaliczono kontroli „${label}”: oczekiwano ${expected.toFixed(
        2
      )}, otrzymano ${String(actual)}.`
    );
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
