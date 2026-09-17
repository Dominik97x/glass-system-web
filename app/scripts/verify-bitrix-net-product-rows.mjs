import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const appDir = path.basename(cwd) === "app" ? cwd : path.join(cwd, "app");
const snapshotPath = path.join(
  appDir,
  "src",
  "data",
  "pricing",
  "glass-system",
  "published-pricing.generated.json"
);
const builderPath = path.join(
  appDir,
  "src",
  "integrations",
  "bitrix24",
  "Bitrix24InquiryProductRowBuilder.ts"
);
const vatChangerPath = path.join(appDir, "scripts", "bitrix24-vat-changer.ts");
const envPath = path.join(appDir, ".env.local");

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const builderSource = fs.readFileSync(builderPath, "utf8");
const vatChangerSource = fs.readFileSync(vatChangerPath, "utf8");

assertEqual(snapshot.metadata.canonicalPriceMode, "net", "canonicalPriceMode");
assertEqual(snapshot.metadata.defaultPriceMode, "net", "defaultPriceMode");

const row = snapshot.priceMatrix.find(
  (candidate) =>
    candidate.active &&
    candidate.productType === "terrace_roof" &&
    candidate.lengthCm === 300 &&
    candidate.widthCm === 306
);

if (!row) {
  throw new Error("Brak wiersza terrace_roof 300×306 cm w snapshotcie.");
}

assertEqual(row.constructionNet, 7419, "300×306 constructionNet");
assertEqual(row.constructionGross, 8013, "300×306 constructionGross strony");

const vatRate = Number(snapshot.metadata.bitrixDefaultVatRate ?? 8);
const exactGross = roundMoney(row.constructionNet * (1 + vatRate / 100));
assertEqual(exactGross, 8012.52, "300×306 dokładne brutto Bitrix");

assertContains(
  builderSource,
  "price: calculateBitrixApiPriceFromNet(row.priceNet, vatRate)",
  "builder wysyła do API dokładne brutto wyliczone z netto"
);
assertNotContains(
  builderSource,
  "price: row.priceNet",
  "builder nie może przekazywać netto bezpośrednio do pola price REST"
);
assertContains(builderSource, 'taxIncluded: "N"', "builder ustawia TAX_INCLUDED=N");
assertContains(builderSource, "row.constructionNet", "builder czyta pola netto");
assertContains(
  vatChangerSource,
  'mode === "net-price-tax-not-included"',
  "zmieniarka VAT obsługuje model netto"
);
assertContains(
  vatChangerSource,
  "const unitGross = storedPrice;",
  "zmieniarka poprawnie odczytuje pole price jako brutto REST"
);
assertContains(
  vatChangerSource,
  "const price = preview.rows[index].newUnitGross;",
  "zmieniarka zapisuje nowe brutto REST, zachowując netto"
);

const env = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, "utf8")) : {};
const repositoryMode = env.CALCULATOR_INQUIRY_REPOSITORY ?? "(brak .env.local / brak wartości)";
const configuredVatRate = env.BITRIX24_VAT_RATE ?? "8 (wartość domyślna)";

console.log("D6.6.2.1 — weryfikacja semantyki cen REST Bitrix24 zakończona powodzeniem.");
console.log("Model: źródło netto; do pola price REST trafia dokładne brutto; TAX_INCLUDED=N.");
console.log(
  `300×306 cm: netto ${row.constructionNet.toFixed(2)} PLN; VAT ${vatRate}%; brutto Bitrix ${exactGross.toFixed(2)} PLN; strona ~${row.constructionGross.toFixed(2)} PLN.`
);
console.log(`CALCULATOR_INQUIRY_REPOSITORY=${repositoryMode}`);
console.log(`BITRIX24_VAT_RATE=${configuredVatRate}`);

if (repositoryMode !== "database") {
  console.warn(
    "UWAGA: produkcyjny przepływ D6.6.2 jest podłączony do synchronizacji database → Bitrix24. Przed testem z formularza ustaw CALCULATOR_INQUIRY_REPOSITORY=database."
  );
}

function parseEnv(content) {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    result[key] = rawValue.replace(/^(["'])(.*)\1$/, "$2");
  }

  return result;
}

function assertContains(content, fragment, label) {
  if (!content.includes(fragment)) {
    throw new Error(`Nie zaliczono kontroli „${label}”: brak ${fragment}`);
  }
}

function assertNotContains(content, fragment, label) {
  if (content.includes(fragment)) {
    throw new Error(`Nie zaliczono kontroli „${label}”: znaleziono ${fragment}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `Nie zaliczono kontroli „${label}”: oczekiwano ${expected}, otrzymano ${actual}`
    );
  }
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
