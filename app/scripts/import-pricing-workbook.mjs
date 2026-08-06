import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import * as XLSX from "xlsx";

const PRODUCT_TYPES = ["terrace_roof", "winter_garden"];
const WEBSITE_SHEET_NAME = "10_EXPORT_STRONA";
const BITRIX_NET_SHEET_NAME = "11_EXPORT_NETTO_BITRIX";

const PRICE_FIELD_MAPPINGS = [
  ["construction", "base_poly"],
  ["wallGlassClear", "walls_clear"],
  ["wallGlassTinted", "walls_tinted"],
  ["roofPolycarbonateColored", "roof_poly_colored"],
  ["roofGlassClear", "roof_glass_clear"],
  ["roofGlassTinted", "roof_glass_tinted"],
  ["zipSide", "zip_side"],
  ["zipFront", "zip_front"],
  ["awning", "awning"],
  ["levelingProfile", "foundation"],
  ["ledSpot", "led_point"],
  ["ledStrip", "led_cct"],
  ["brushes", "brushes"],
  ["handles", "handles"],
  ["carriers", "carriers"],
];

const cwd = process.cwd();
const repoRoot = path.basename(cwd) === "app" ? path.resolve(cwd, "..") : cwd;
const appDir = path.join(repoRoot, "app");

const workbookPath = path.join(
  repoRoot,
  "docs",
  "templates",
  "model_cennik_uslug_wycena_strona_moonglass_2026-08-06_FIX22_v2_NETTO_BITRIX_AUDYT.xlsx"
);

const baseSnapshotPath = path.join(
  appDir,
  "src",
  "data",
  "pricing",
  "glass-system",
  "published-pricing.base.json"
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
  const websiteSheet = workbook.Sheets[WEBSITE_SHEET_NAME];
  const bitrixNetSheet = workbook.Sheets[BITRIX_NET_SHEET_NAME];

  if (!websiteSheet) {
    throw new Error(`Sheet ${WEBSITE_SHEET_NAME} was not found in workbook.`);
  }
  if (!bitrixNetSheet) {
    throw new Error(`Sheet ${BITRIX_NET_SHEET_NAME} was not found in workbook.`);
  }

  const baseSnapshot = JSON.parse(await fs.readFile(baseSnapshotPath, "utf8"));
  const websiteRows = XLSX.utils.sheet_to_json(websiteSheet, { defval: "" });
  const netRows = XLSX.utils.sheet_to_json(bitrixNetSheet, { defval: "" });

  const websiteByDimension = new Map(
    websiteRows.map((row) => [normalizeDimensionKey(row.dimension), row])
  );
  const netByDimension = new Map(
    netRows.map((row) => [normalizeDimensionKey(row.dimension), row])
  );

  assertSameDimensionSet(websiteByDimension, netByDimension);

  const sourceRows = [...netByDimension.entries()]
    .map(([dimensionKey, netRow]) =>
      normalizeSourceRow(dimensionKey, netRow, websiteByDimension.get(dimensionKey))
    )
    .sort(compareSourceRows);

  const dimensions = [];
  const priceMatrix = [];

  for (const productType of PRODUCT_TYPES) {
    for (const sourceRow of sourceRows) {
      dimensions.push({
        productType,
        widthCm: sourceRow.depthCm,
        lengthCm: sourceRow.widthCm,
        label: sourceRow.dimensionLabel,
        series: "PRO",
        active: sourceRow.active,
      });
      priceMatrix.push(createPriceMatrixRow(productType, sourceRow));
    }
  }

  const importedAt = new Date().toISOString();
  const snapshot = {
    ...baseSnapshot,
    metadata: {
      ...baseSnapshot.metadata,
      pricingVersion: `moonglass-fix22-netto-${importedAt.slice(0, 10)}`,
      source: path.relative(repoRoot, workbookPath).replaceAll("\\", "/"),
      importedAt,
      currency: "PLN",
      defaultPriceMode: "net",
      canonicalPriceMode: "net",
      defaultVatRate: 8,
      websiteDefaultVatRate: 8,
      bitrixDefaultVatRate: 8,
    },
    vatRules: baseSnapshot.vatRules.map((rule) => ({
      ...rule,
      vatRate: 8,
      taxIncluded: false,
      priceMode: "net",
      active: true,
    })),
    dimensions,
    priceMatrix,
  };

  const audit = auditSourceRows(sourceRows, snapshot.metadata.websiteDefaultVatRate);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log("FIX22 pricing workbook imported successfully.");
  console.log(`Workbook: ${path.relative(repoRoot, workbookPath)}`);
  console.log(`Output:   ${path.relative(repoRoot, outputPath)}`);
  console.log(`Source dimensions: ${sourceRows.length}`);
  console.log(`Snapshot rows:     ${priceMatrix.length}`);
  console.log(`Exact gross checks: ${audit.exact}`);
  console.log(`Rounding <= 1 PLN:  ${audit.rounding}`);
  console.log(`Differences > 1 PLN:${audit.mismatch}`);

  if (audit.mismatch > 1) {
    throw new Error(
      `Unexpected number of gross/net mismatches above 1 PLN: ${audit.mismatch}.`
    );
  }
}

function normalizeSourceRow(dimensionKey, netRow, websiteRow) {
  if (!websiteRow) {
    throw new Error(`Missing website row for dimension ${dimensionKey}.`);
  }

  const widthCm = toNumber(netRow.width_cm);
  const depthCm = toNumber(netRow.depth_cm);
  const dimensionLabel = String(netRow.dimension || websiteRow.dimension).trim();
  const vatRate = normalizeVatRate(netRow.default_vat_rate);
  const active =
    normalizeStatus(netRow.source_status) === "OK" &&
    normalizeStatus(websiteRow.status) === "OK";

  const prices = {};
  for (const [jsonPrefix, workbookPrefix] of PRICE_FIELD_MAPPINGS) {
    prices[`${jsonPrefix}Net`] = toNumber(netRow[`${workbookPrefix}_net`]);
    prices[`${jsonPrefix}Gross`] = toNumber(websiteRow[`${workbookPrefix}_gross`]);
  }

  return {
    dimensionLabel,
    widthCm,
    depthCm,
    vatRate,
    active,
    availability: {
      roofGlass: toBooleanPolish(websiteRow.is_glass_available),
      ledRgb: toBooleanPolish(websiteRow.is_led_rgb_available),
    },
    auditStatus: String(netRow.audit_status || "").trim(),
    prices,
  };
}

function createPriceMatrixRow(productType, sourceRow) {
  const p = sourceRow.prices;
  return {
    productType,
    widthCm: sourceRow.depthCm,
    lengthCm: sourceRow.widthCm,

    constructionNet: p.constructionNet,
    constructionGross: p.constructionGross,

    wallGlassClearNet: p.wallGlassClearNet,
    wallGlassClearGross: p.wallGlassClearGross,
    wallGlassMilkyNet: 0,
    wallGlassMilkyGross: 0,
    wallGlassTintedNet: p.wallGlassTintedNet,
    wallGlassTintedGross: p.wallGlassTintedGross,

    roofPolycarbonateClearNet: 0,
    roofPolycarbonateClearGross: 0,
    roofPolycarbonateMilkyNet: p.roofPolycarbonateColoredNet,
    roofPolycarbonateMilkyGross: p.roofPolycarbonateColoredGross,
    roofPolycarbonateGreyNet: p.roofPolycarbonateColoredNet,
    roofPolycarbonateGreyGross: p.roofPolycarbonateColoredGross,
    roofPolycarbonateSmokeNet: p.roofPolycarbonateColoredNet,
    roofPolycarbonateSmokeGross: p.roofPolycarbonateColoredGross,
    roofGlassClearNet: p.roofGlassClearNet,
    roofGlassClearGross: p.roofGlassClearGross,
    roofGlassMilkyNet: 0,
    roofGlassMilkyGross: 0,
    roofGlassTintedNet: p.roofGlassTintedNet,
    roofGlassTintedGross: p.roofGlassTintedGross,

    zipRightNet: p.zipSideNet,
    zipRightGross: p.zipSideGross,
    zipLeftNet: p.zipSideNet,
    zipLeftGross: p.zipSideGross,
    zipFrontNet: p.zipFrontNet,
    zipFrontGross: p.zipFrontGross,

    awningNet: p.awningNet,
    awningGross: p.awningGross,
    levelingProfileNet: p.levelingProfileNet,
    levelingProfileGross: p.levelingProfileGross,
    ledSpotNet: p.ledSpotNet,
    ledSpotGross: p.ledSpotGross,
    ledStripNet: p.ledStripNet,
    ledStripGross: p.ledStripGross,
    ledCobNet: 0,
    ledCobGross: 0,
    handlesNet: p.handlesNet,
    handlesGross: p.handlesGross,
    brushesNet: p.brushesNet,
    brushesGross: p.brushesGross,
    carriersNet: p.carriersNet,
    carriersGross: p.carriersGross,

    active: sourceRow.active,
    availability: sourceRow.availability,
    sourceAuditStatus: sourceRow.auditStatus,
  };
}

function auditSourceRows(rows, vatRate) {
  let exact = 0;
  let rounding = 0;
  let mismatch = 0;

  for (const row of rows) {
    if (Math.abs(row.vatRate - vatRate) > 0.0001) {
      throw new Error(
        `Unexpected VAT rate ${row.vatRate}% for ${row.dimensionLabel}; expected ${vatRate}%.`
      );
    }

    for (const [prefix] of PRICE_FIELD_MAPPINGS) {
      const net = row.prices[`${prefix}Net`];
      const gross = row.prices[`${prefix}Gross`];
      if (net === 0 && gross === 0) {
        exact += 1;
        continue;
      }
      const expectedRounded = Math.round(net * (1 + vatRate / 100));
      const difference = Math.abs(expectedRounded - gross);
      if (difference === 0) exact += 1;
      else if (difference <= 1) rounding += 1;
      else mismatch += 1;
    }
  }

  return { exact, rounding, mismatch };
}

function assertSameDimensionSet(websiteByDimension, netByDimension) {
  const onlyWebsite = [...websiteByDimension.keys()].filter(
    (key) => !netByDimension.has(key)
  );
  const onlyNet = [...netByDimension.keys()].filter(
    (key) => !websiteByDimension.has(key)
  );

  if (onlyWebsite.length || onlyNet.length) {
    throw new Error(
      `Dimension sets differ. Only website: ${onlyWebsite.join(", ") || "none"}; only net: ${
        onlyNet.join(", ") || "none"
      }.`
    );
  }
}

function normalizeDimensionKey(value) {
  return String(value).replace(/\s/g, "").toLowerCase();
}

function normalizeStatus(value) {
  return String(value).trim().toUpperCase();
}

function normalizeVatRate(value) {
  const numeric = toNumber(value);
  return numeric > 0 && numeric <= 1 ? numeric * 100 : numeric;
}

function compareSourceRows(left, right) {
  if (left.widthCm !== right.widthCm) return left.widthCm - right.widthCm;
  return left.depthCm - right.depthCm;
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (value === undefined || value === null || value === "") return 0;
  const normalized = String(value).replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return parsed;
}

function toBooleanPolish(value) {
  const normalized = String(value).trim().toUpperCase();
  return normalized === "TAK" || normalized === "YES" || normalized === "TRUE" || normalized === "1";
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
