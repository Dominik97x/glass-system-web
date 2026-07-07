import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import * as XLSX from "xlsx";

const PRICE_FIELDS = [
  "constructionGross",

  "roofPolycarbonateClearGross",
  "roofPolycarbonateMilkyGross",
  "roofPolycarbonateGreyGross",
  "roofPolycarbonateSmokeGross",
  "roofGlassClearGross",
  "roofGlassMilkyGross",
  "roofGlassTintedGross",

  "wallGlassClearGross",
  "wallGlassMilkyGross",
  "wallGlassTintedGross",

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
];

const PRODUCT_TYPES = ["terrace_roof", "winter_garden"];

const cwd = process.cwd();
const repoRoot = path.basename(cwd) === "app" ? path.resolve(cwd, "..") : cwd;
const appDir = path.join(repoRoot, "app");

const workbookPath = path.join(
  repoRoot,
  "docs",
  "templates",
  "glass-system-pricing-workbook-filled-from-cennik.xlsx"
);

const baseSnapshotPath = path.join(
  appDir,
  "src",
  "data",
  "pricing",
  "eg",
  "published-pricing.example.json"
);

const outputPath = path.join(
  appDir,
  "src",
  "data",
  "pricing",
  "glass-system",
  "published-pricing.generated.json"
);

async function main() {
  const workbookBuffer = await fs.readFile(workbookPath);
  const workbook = XLSX.read(workbookBuffer, { type: "buffer" });
  const priceMatrixSheet = workbook.Sheets.app_price_matrix;

  if (!priceMatrixSheet) {
    throw new Error("Sheet app_price_matrix was not found in workbook.");
  }

  const baseSnapshot = JSON.parse(await fs.readFile(baseSnapshotPath, "utf8"));

  const rawRows = XLSX.utils.sheet_to_json(priceMatrixSheet, {
    defval: 0,
  });

  const priceMatrix = rawRows
    .map(normalizePriceMatrixRow)
    .filter((row) => PRODUCT_TYPES.includes(row.productType));

  const dimensions = createDimensions(priceMatrix);

  const snapshot = {
    ...baseSnapshot,
    metadata: {
      ...baseSnapshot.metadata,
      pricingVersion: `generated-from-cennik-${new Date()
        .toISOString()
        .slice(0, 10)}`,
      source:
        "docs/templates/glass-system-pricing-workbook-filled-from-cennik.xlsx",
      importedAt: new Date().toISOString(),
      currency: "PLN",
      defaultPriceMode: "gross",
      defaultVatRate: 8,
    },
    productTypes: baseSnapshot.productTypes,
    dimensions,
    priceMatrix,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8"
  );

  console.log("Pricing workbook imported successfully.");
  console.log(`Workbook: ${path.relative(repoRoot, workbookPath)}`);
  console.log(`Output:   ${path.relative(repoRoot, outputPath)}`);
  console.log(`Rows:     ${priceMatrix.length}`);
  console.log(`Dims:     ${dimensions.length}`);
}

function normalizePriceMatrixRow(row) {
  const productType = String(
    getValue(row, "productType", "product_type")
  ).trim();

  const lengthCm = toNumber(getValue(row, "lengthCm", "length_cm"));
  const widthCm = toNumber(getValue(row, "widthCm", "width_cm"));

  const normalizedRow = {
    productType,
    lengthCm,
    widthCm,
    dimensionLabel:
      String(getValue(row, "dimensionLabel", "dimension_label")).trim() ||
      `${lengthCm} x ${widthCm} cm`,
    active: toBoolean(getValue(row, "active")),
  };

  for (const priceField of PRICE_FIELDS) {
    normalizedRow[priceField] = toNumber(getValue(row, priceField));
  }

  return normalizedRow;
}

function createDimensions(priceMatrix) {
  const dimensionsByKey = new Map();

  for (const row of priceMatrix) {
    const key = `${row.productType}:${row.lengthCm}x${row.widthCm}`;

    if (!dimensionsByKey.has(key)) {
      dimensionsByKey.set(key, {
        productType: row.productType,
        lengthCm: row.lengthCm,
        widthCm: row.widthCm,
        label: row.dimensionLabel,
        active: row.active,
      });
    }
  }

  return Array.from(dimensionsByKey.values()).sort((a, b) => {
    if (a.productType !== b.productType) {
      return a.productType.localeCompare(b.productType);
    }

    if (a.lengthCm !== b.lengthCm) {
      return a.lengthCm - b.lengthCm;
    }

    return a.widthCm - b.widthCm;
  });
}

function getValue(row, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }

  return undefined;
}

function toNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const normalizedValue = String(value).replace(/\s/g, "").replace(",", ".");

  const numberValue = Number(normalizedValue);

  if (Number.isNaN(numberValue)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return numberValue;
}

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  return (
    normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});