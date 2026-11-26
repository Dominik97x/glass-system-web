import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PRICE_PAIRS = [
  ["constructionNet", "constructionGross"],
  ["wallGlassClearNet", "wallGlassClearGross"],
  ["wallGlassTintedNet", "wallGlassTintedGross"],
  ["roofPolycarbonateMilkyNet", "roofPolycarbonateMilkyGross"],
  ["roofGlassClearNet", "roofGlassClearGross"],
  ["roofGlassTintedNet", "roofGlassTintedGross"],
  ["zipRightNet", "zipRightGross"],
  ["zipFrontNet", "zipFrontGross"],
  ["awningNet", "awningGross"],
  ["levelingProfileNet", "levelingProfileGross"],
  ["ledSpotNet", "ledSpotGross"],
  ["ledStripNet", "ledStripGross"],
  ["brushesNet", "brushesGross"],
  ["handlesNet", "handlesGross"],
  ["carriersNet", "carriersGross"],
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

const snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf8"));
const core = JSON.parse(await fs.readFile(
  path.join(path.dirname(snapshotPath), "crm-core-products.generated.json"), "utf8"
));
const coreByKey = new Map(core.products.map(p => [`${p.family}|${p.dimensionKey}`, p]));

const errors = [];

assert(snapshot.metadata.defaultPriceMode === "net", "defaultPriceMode must be net");
assert(snapshot.metadata.canonicalPriceMode === "net", "canonicalPriceMode must be net");
assert(snapshot.metadata.websiteDefaultVatRate === 8, "websiteDefaultVatRate must be 8");
assert(snapshot.metadata.bitrixDefaultVatRate === 8, "bitrixDefaultVatRate must be 8");
assert(snapshot.priceMatrix.length === 140, "priceMatrix must contain 140 rows");
assert(snapshot.dimensions.length === 140, "dimensions must contain 140 rows");

const terraceRows = snapshot.priceMatrix.filter(
  (row) => row.productType === "terrace_roof"
);
const winterRows = snapshot.priceMatrix.filter(
  (row) => row.productType === "winter_garden"
);
assert(terraceRows.length === 70, "terrace_roof must contain 70 rows");
assert(winterRows.length === 70, "winter_garden must contain 70 rows");

const first = terraceRows.find(
  (row) => row.lengthCm === 300 && row.widthCm === 306
);
assert(Boolean(first), "Missing 300 x 306 cm row");
if (first) {
  assert(first.constructionNet === 8904, "300 x 306 constructionNet must be 8904");
  assert(first.constructionGross === 9616, "300 x 306 constructionGross must be 9616");
  assert(first.handlesNet === 393, "300 x 306 handlesNet must be 393");
  assert(first.brushesNet === 435, "300 x 306 brushesNet must be 435");
}

let exact = 0;
let rounding = 0;
let mismatch = 0;
const mismatchDetails = [];
for (const row of snapshot.priceMatrix) {
  for (const [netField, grossField] of PRICE_PAIRS) {
    const net = row[netField];
    const gross = row[grossField];
    assert(Number.isFinite(net) && net >= 0 && Number.isFinite(gross) && gross >= 0, `Invalid price ${row.productType}|${row.lengthCm}x${row.widthCm} ${netField}`);
    const expected = Math.round(net * 1.08);
    const difference = expected - gross;
    if (difference === 0) exact += 1;
    else if (Math.abs(difference) <= 1) rounding += 1;
    else {
      mismatch += 1;
      mismatchDetails.push({
        dimension: `${row.lengthCm} x ${row.widthCm} cm`,
        field: grossField,
        net,
        expected,
        gross,
        difference,
      });
    }
  }
}

assert(exact === 2100, `Expected 2100 exact checks, got ${exact}`);
assert(rounding === 0, `Expected 0 rounding checks, got ${rounding}`);
assert(mismatch === 0, `Expected 0 mismatch above 1 PLN, got ${mismatch}`);

for (const terrace of terraceRows) {
  const winter = winterRows.find(
    (row) => row.lengthCm === terrace.lengthCm && row.widthCm === terrace.widthCm
  );
  assert(Boolean(winter), `Missing winter_garden duplicate for ${terrace.lengthCm} x ${terrace.widthCm}`);
  if (!winter) continue;
  for (const [netField, grossField] of PRICE_PAIRS) {
    if (netField === "roofGlassClearNet") continue; // validated against CRM Core below
    assert(
      terrace[netField] === winter[netField] && terrace[grossField] === winter[grossField],
      `Product type price mismatch for ${terrace.lengthCm} x ${terrace.widthCm}: ${netField}/${grossField}`
    );
  }
}

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
  console.error("Reconciled net pricing verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Reconciled net pricing verification passed.");
  console.log(`Rows: ${snapshot.priceMatrix.length} (70 dimensions x 2 product types)`);
  console.log(`Audit: exact=${exact}, rounding<=1PLN=${rounding}, mismatch>1PLN=${mismatch}`);
  console.log(`CRM Core row checks: ${coreChecks}`);
  console.log("300 x 306 cm: net 8904 PLN, website gross 9616 PLN.");
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}
