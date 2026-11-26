import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PRICE_PAIRS = [
  ["constructionNet", "constructionGross"],
  ["wallGlassClearNet", "wallGlassClearGross"],
  ["wallGlassTintedNet", "wallGlassTintedGross"],

  ["roofPolycarbonateMilkyNet", "roofPolycarbonateMilkyGross"],
  ["roofPolycarbonateGreyNet", "roofPolycarbonateGreyGross"],
  ["roofPolycarbonateSmokeNet", "roofPolycarbonateSmokeGross"],

  ["roofGlassClearNet", "roofGlassClearGross"],
  ["roofGlassTintedNet", "roofGlassTintedGross"],

  ["zipRightNet", "zipRightGross"],
  ["zipLeftNet", "zipLeftGross"],
  ["zipFrontNet", "zipFrontGross"],

  ["awningNet", "awningGross"],
  ["levelingProfileNet", "levelingProfileGross"],

  ["ledSpotNet", "ledSpotGross"],
  ["ledStripNet", "ledStripGross"],

  ["brushesNet", "brushesGross"],
  ["handlesNet", "handlesGross"],
  ["carriersNet", "carriersGross"],
  ["wallGlassMilkyNet", "wallGlassMilkyGross"],
  ["roofPolycarbonateClearNet", "roofPolycarbonateClearGross"],
  ["roofGlassMilkyNet", "roofGlassMilkyGross"],
  ["ledCobNet", "ledCobGross"],
];

const REQUIRED_POSITIVE_FIELDS = [
  "constructionNet",
  "wallGlassClearNet",
  "zipRightNet",
  "zipLeftNet",
  "zipFrontNet",
  "awningNet",
  "ledSpotNet",
  "ledStripNet",
];

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

const snapshot = JSON.parse(
  await fs.readFile(snapshotPath, "utf8")
);

const core = JSON.parse(await fs.readFile(
  path.join(path.dirname(snapshotPath), "crm-core-products.generated.json"), "utf8"
));
const coreByKey = new Map(core.products.map(p => [`${p.family}|${p.dimensionKey}`, p]));

const errors = [];
const warnings = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function rowKey(row) {
  return `${row.productType}|${row.lengthCm}x${row.widthCm}`;
}

function findRow(type, lengthCm, widthCm) {
  return snapshot.priceMatrix.find(
    (row) =>
      row.productType === type &&
      row.lengthCm === lengthCm &&
      row.widthCm === widthCm
  );
}

// ============================================================
// METADATA
// ============================================================

assert(
  snapshot.metadata.defaultPriceMode === "net",
  "defaultPriceMode must be net"
);

assert(
  snapshot.metadata.canonicalPriceMode === "net",
  "canonicalPriceMode must be net"
);

assert(
  snapshot.metadata.websiteDefaultVatRate === 8,
  "websiteDefaultVatRate must be 8"
);

assert(
  snapshot.metadata.bitrixDefaultVatRate === 8,
  "bitrixDefaultVatRate must be 8"
);

// ============================================================
// STRUKTURA
// ============================================================

assert(
  snapshot.priceMatrix.length === 140,
  `priceMatrix must contain 140 rows, got ${snapshot.priceMatrix.length}`
);

assert(
  snapshot.dimensions.length === 140,
  `dimensions must contain 140 rows, got ${snapshot.dimensions.length}`
);

const terraceRows = snapshot.priceMatrix.filter(
  (row) => row.productType === "terrace_roof"
);

const winterRows = snapshot.priceMatrix.filter(
  (row) => row.productType === "winter_garden"
);

assert(
  terraceRows.length === 70,
  `terrace_roof must contain 70 rows, got ${terraceRows.length}`
);

assert(
  winterRows.length === 70,
  `winter_garden must contain 70 rows, got ${winterRows.length}`
);

// ============================================================
// VAT 8% + BRAK CEN UJEMNYCH
// ============================================================

let vatChecks = 0;

for (const row of snapshot.priceMatrix) {
  for (const [netField, grossField] of PRICE_PAIRS) {
    const net = row[netField];
    const gross = row[grossField];

    assert(
      Number.isFinite(net),
      `${rowKey(row)} ${netField} is not numeric`
    );

    assert(
      Number.isFinite(gross),
      `${rowKey(row)} ${grossField} is not numeric`
    );

    assert(
      net >= 0,
      `${rowKey(row)} ${netField} is negative: ${net}`
    );

    assert(
      gross >= 0,
      `${rowKey(row)} ${grossField} is negative: ${gross}`
    );

    const expected = Math.round(net * 1.08);

    assert(
      gross === expected,
      `${rowKey(row)} VAT mismatch for ${netField}/${grossField}: net=${net}, gross=${gross}, expected=${expected}`
    );

    vatChecks += 1;
  }
}

// ============================================================
// POLA, KTÓRE NIE MOGĄ BYĆ ZEROWE
// ============================================================

for (const row of snapshot.priceMatrix) {
  for (const field of REQUIRED_POSITIVE_FIELDS) {
    const value = Number(row[field] ?? 0);

    assert(
      value > 0,
      `${rowKey(row)} ${field} must be > 0, got ${value}`
    );
  }
}

// ============================================================
// DACH SZKLANY — availability
// ============================================================

let noGlassCount = 0;

for (const row of snapshot.priceMatrix) {
  const hasGlass = Boolean(row.availability?.roofGlass);

  if (!hasGlass) {
    noGlassCount += 1;

    assert(
      Number(row.roofGlassClearNet ?? 0) === 0,
      `${rowKey(row)} roofGlassClearNet must be 0 when roofGlass=false`
    );

    assert(
      Number(row.roofGlassClearGross ?? 0) === 0,
      `${rowKey(row)} roofGlassClearGross must be 0 when roofGlass=false`
    );

    assert(
      Number(row.roofGlassTintedNet ?? 0) === 0,
      `${rowKey(row)} roofGlassTintedNet must be 0 when roofGlass=false`
    );

    assert(
      Number(row.roofGlassTintedGross ?? 0) === 0,
      `${rowKey(row)} roofGlassTintedGross must be 0 when roofGlass=false`
    );
  } else {
    assert(
      Number(row.roofGlassClearNet ?? 0) > 0,
      `${rowKey(row)} roofGlassClearNet must be > 0 when roofGlass=true`
    );
  }
}

assert(vatChecks === 3080, `Expected 3080 VAT checks, got ${vatChecks}`);

assert(
  noGlassCount === 40,
  `Expected 40 rows with roofGlass=false, got ${noGlassCount}`
);

// ============================================================
// Shared fields must agree; clear-glass increments are verified against CRM Core.
// ============================================================

const winterMap = new Map(
  winterRows.map((row) => [
    `${row.lengthCm}x${row.widthCm}`,
    row,
  ])
);

for (const terrace of terraceRows) {
  const dim = `${terrace.lengthCm}x${terrace.widthCm}`;
  const winter = winterMap.get(dim);

  assert(
    Boolean(winter),
    `Missing winter_garden duplicate for ${dim}`
  );

  if (!winter) continue;

  for (const [netField, grossField] of PRICE_PAIRS) {
    if (netField === "roofGlassClearNet") continue; // validated against CRM Core below
    assert(
      terrace[netField] === winter[netField],
      `Product type mismatch ${dim}: ${netField}`
    );

    assert(
      terrace[grossField] === winter[grossField],
      `Product type mismatch ${dim}: ${grossField}`
    );
  }

  assert(
    Boolean(terrace.availability?.roofGlass) ===
      Boolean(winter.availability?.roofGlass),
    `Product type mismatch ${dim}: availability.roofGlass`
  );
}

// ============================================================
// CENY KONTROLNE — 15.11.2026
// ============================================================

const checks = [
  {
    type: "terrace_roof",
    l: 300,
    w: 306,
    fields: {
      constructionNet: 8904,
      constructionGross: 9616,
      wallGlassTintedNet: 1660,
      roofGlassTintedNet: 522,
      zipLeftNet: 2784,
      zipRightNet: 2784,
      zipFrontNet: 2784,
      awningNet: 5073,
      ledSpotNet: 722,
      ledStripNet: 1669,
      levelingProfileNet: 1240,
    },
  },

  {
    type: "terrace_roof",
    l: 450,
    w: 306,
    fields: {
      roofGlassClearNet: 6079,
      ledStripNet: 2406,
    },
  },

  {
    type: "terrace_roof",
    l: 500,
    w: 306,
    fields: {
      roofGlassClearNet: 6761,
      ledStripNet: 5014,
    },
  },

  {
    type: "terrace_roof",
    l: 550,
    w: 306,
    fields: {
      roofGlassClearNet: 0,
      roofGlassTintedNet: 0,
      ledStripNet: 2553,
    },
  },

  {
    type: "terrace_roof",
    l: 600,
    w: 1206,
    fields: {
      roofGlassClearNet: 0,
      roofGlassTintedNet: 0,
      ledSpotNet: 2593,
      ledStripNet: 7483,
    },
  },
];

for (const check of checks) {
  const row = findRow(
    check.type,
    check.l,
    check.w
  );

  assert(
    Boolean(row),
    `Missing control row ${check.type}|${check.l}x${check.w}`
  );

  if (!row) continue;

  for (const [field, expected] of Object.entries(check.fields)) {
    assert(
      row[field] === expected,
      `${check.type}|${check.l}x${check.w} ${field} must be ${expected}, got ${row[field]}`
    );
  }
}

// ============================================================
// ZNANE REGUŁY DOSTĘPNOŚCI
// ============================================================

for (const row of snapshot.priceMatrix) {
  if (row.lengthCm === 550 || row.lengthCm === 600) {
    assert(
      row.availability?.roofGlass === false,
      `${rowKey(row)} roofGlass must be false for 550/600`
    );
  }
}

// ============================================================
// WYNIK
// ============================================================

// The two product types may have different clear-glass roof increments.
// Validate each against its own complete CRM product, not against the other type.
assert(core.products.length === 640 && coreByKey.size === 640, "CRM Core count/unique keys");
assert(core.metadata.priceMode === "net" && core.metadata.currency === "PLN", "CRM Core price mode/currency");
const rowKeys = new Set(snapshot.priceMatrix.map(r => `${r.productType}|${r.lengthCm}x${r.widthCm}`));
assert(rowKeys.size === 140, "Duplicate price matrix row");
function coreNet(family, dim) {
  const product = coreByKey.get(`${family}|${dim}`);
  assert(Boolean(product) && Number.isFinite(product?.priceNet) && product.priceNet > 0 && product.currency === "PLN", `Invalid/missing CRM price ${family}|${dim}`);
  return product?.priceNet ?? NaN;
}
let coreChecks = 0;
for (const row of snapshot.priceMatrix) {
  const dim = `${row.lengthCm}x${row.widthCm}`;
  const tr = coreNet("terrace_roof_poly", dim) + coreNet("installation_terrace_roof", dim);
  const wg = coreNet("winter_garden_poly", dim) + coreNet("installation_winter_garden", dim);
  const terrace = row.productType === "terrace_roof";
  const expectedGlass = [300,350,400,450,500].includes(row.lengthCm);
  assert(row.availability?.roofGlass === expectedGlass, `Glass availability ${row.productType}|${dim}`);
  assert(row.constructionNet === tr, `Construction with installation ${row.productType}|${dim}`);
  assert(row.wallGlassClearNet === wg - tr, `Winter garden increment with installation ${row.productType}|${dim}`);
  assert(row.wallGlassTintedNet === coreNet("wall_glass_tint_surcharge", dim), `Wall tint ${row.productType}|${dim}`);
  const polyColor = coreNet("roof_poly_color_surcharge", dim);
  for (const field of ["roofPolycarbonateMilkyNet", "roofPolycarbonateGreyNet", "roofPolycarbonateSmokeNet"]) {
    assert(row[field] === polyColor, `${field} ${row.productType}|${dim}`);
  }
  const prefix = terrace ? "terrace_roof" : "winter_garden";
  const glass = expectedGlass ? coreNet(`${prefix}_glass`, dim) - coreNet(`${prefix}_poly`, dim) : 0;
  assert(row.roofGlassClearNet === glass && row.roofGlassClearGross === Math.round(glass * 1.08), `Clear glass increment ${row.productType}|${dim}`);
  const tint = expectedGlass ? coreNet("roof_glass_color_surcharge", dim) : 0;
  assert(row.roofGlassTintedNet === tint, `Glass tint ${row.productType}|${dim}`);
  assert(row.availability?.ledRgb === false, `Legacy matrix RGB flag must remain false (runtime policy uses CRM Core) ${row.productType}|${dim}`);
  coreChecks++;
}

if (errors.length > 0) {
  console.error("Pricing 2026-11-15 verification FAILED:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exitCode = 1;
} else {
  console.log("Pricing 2026-11-15 verification PASSED.");
  console.log(
    `Rows: ${snapshot.priceMatrix.length} (70 dimensions x 2 product types)`
  );
  console.log(`VAT checks: ${vatChecks}`);
  console.log(`roofGlass=false rows: ${noGlassCount}`);
  console.log("Control prices: OK");
  console.log("Shared fields parity: OK");
  console.log(`CRM Core row checks: ${coreChecks}`);
}

if (warnings.length > 0) {
  console.warn("Warnings:");

  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}
