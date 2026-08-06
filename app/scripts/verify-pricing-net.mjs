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
  assert(first.constructionNet === 7419, "300 x 306 constructionNet must be 7419");
  assert(first.constructionGross === 8013, "300 x 306 constructionGross must be 8013");
  assert(first.handlesNet === 365, "300 x 306 handlesNet must be 365");
  assert(first.brushesNet === 400, "300 x 306 brushesNet must be 400");
}

let exact = 0;
let rounding = 0;
let mismatch = 0;
const mismatchDetails = [];
for (const row of terraceRows) {
  for (const [netField, grossField] of PRICE_PAIRS) {
    const net = Number(row[netField] ?? 0);
    const gross = Number(row[grossField] ?? 0);
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

assert(exact === 988, `Expected 988 exact checks, got ${exact}`);
assert(rounding === 61, `Expected 61 rounding checks, got ${rounding}`);
assert(mismatch === 1, `Expected 1 mismatch above 1 PLN, got ${mismatch}`);

for (const terrace of terraceRows) {
  const winter = winterRows.find(
    (row) => row.lengthCm === terrace.lengthCm && row.widthCm === terrace.widthCm
  );
  assert(Boolean(winter), `Missing winter_garden duplicate for ${terrace.lengthCm} x ${terrace.widthCm}`);
  if (!winter) continue;
  for (const [netField, grossField] of PRICE_PAIRS) {
    assert(
      terrace[netField] === winter[netField] && terrace[grossField] === winter[grossField],
      `Product type price mismatch for ${terrace.lengthCm} x ${terrace.widthCm}: ${netField}/${grossField}`
    );
  }
}

if (errors.length > 0) {
  console.error("FIX22 net pricing verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("FIX22 net pricing verification passed.");
  console.log(`Rows: ${snapshot.priceMatrix.length} (70 dimensions x 2 product types)`);
  console.log(`Audit: exact=${exact}, rounding<=1PLN=${rounding}, mismatch>1PLN=${mismatch}`);
  console.log("Known mismatch:", mismatchDetails[0]);
  console.log("300 x 306 cm: net 7419 PLN, website gross 8013 PLN.");
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}
