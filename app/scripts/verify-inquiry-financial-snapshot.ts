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
assertEqual(snapshot.items.length, 7, "liczba szczegółowych pozycji");
assertEqual(snapshot.websiteItems.length, 5, "liczba grup widocznych na stronie");
assertEqual(snapshot.defaultVatRate, 8, "domyślna stawka VAT");
assertMoney(snapshot.totalNet, 17632, "suma netto");
assertMoney(snapshot.totalTaxAmount, 1410.56, "suma VAT");
assertMoney(snapshot.totalGross, 19042.56, "dokładna suma brutto");
assertMoney(snapshot.websiteTotalGross, 19043, "suma pokazywana na stronie");


const expectedItemIds = [
  "construction",
  "zip_front",
  "awning",
  "led_cct",
  "leveling_profile",
  "brushes",
  "handles",
];
assertEqual(
  snapshot.items.map((item) => item.id).join(","),
  expectedItemIds.join(","),
  "kolejność szczegółowych pozycji"
);

const construction = snapshot.items.find((item) => item.id === "construction");
if (!construction) {
  throw new Error("Brak pozycji construction w snapshotcie.");
}

assertMoney(construction.totalPriceNet, 7419, "konstrukcja netto");
assertMoney(construction.totalTaxAmount, 593.52, "konstrukcja VAT");
assertMoney(construction.totalPriceGross, 8012.52, "konstrukcja brutto");
assertMoney(
  construction.websiteTotalPriceGross,
  8013,
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
  `Strona pozostaje bez zmian: około ${snapshot.websiteTotalGross.toFixed(2)} PLN brutto.`
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
