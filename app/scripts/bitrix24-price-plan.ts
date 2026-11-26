import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { loadProvisionerEnv } from "./bitrix24/env";
import { Bitrix24FullCatalogManager } from "./bitrix24/full-catalog";
import { buildPublishedCatalogProducts } from "./bitrix24/catalog-products";

// PLAN ONLY. No catalog writes, no creation, no changes to the snapshots.
const cwd = process.cwd();
const pricingDir = path.join(cwd, "src/data/pricing/glass-system");
const snapshotNames = [
  "published-pricing.generated.json",
  "crm-core-products.generated.json",
  "crm-catalog-addons.generated.json",
];
const skuKey = (value: unknown) => String(value ?? "").trim().toUpperCase();
const goodId = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

function snapshotState() {
  return snapshotNames.map((name, index) => {
    const bytes = fs.readFileSync(path.join(pricingDir, name));
    const data = JSON.parse(bytes.toString("utf8"));
    const m = data.metadata ?? {};
    const mode = index === 0 ? m.canonicalPriceMode : m.priceMode;
    if (mode !== "net" || m.currency !== "PLN" ||
        (index === 0 && m.defaultPriceMode !== "net")) {
      throw new Error(`Invalid net/PLN metadata: ${name}`);
    }
    return {
      name, sha256: createHash("sha256").update(bytes).digest("hex"),
      version: String(m.pricingVersion ?? m.version ?? ""),
      status: String(m.status ?? ""), priceMode: mode, currency: m.currency,
    };
  });
}

// Suggestions only. These NEVER qualify a row for automatic price updates.
function suggestedAliases(sku: string): string[] {
  const tracks: Record<string, number> = {194:2,241:3,290:3,337:4,386:4,433:5,482:5,529:6,578:6};
  const slide = sku.match(/^MG-CRM-SLIDE-(CLEAR|TINT-SUR|MILKY-SUR)-(\d+)$/);
  if (slide && tracks[slide[2]]) {
    const variant = slide[1] === "MILKY-SUR" ? "MILK-SUR" : slide[1];
    return [`MG-SVC-SLIDE-${tracks[slide[2]]}T-${slide[2]}-${variant}`];
  }
  const triangle = sku.match(/^MG-CRM-TRI-MAT-(\d+)$/);
  if (triangle && tracks[triangle[1]]) {
    return [`MG-SVC-TRIANGLE-${tracks[triangle[1]]}T-${triangle[1]}`];
  }
  const parts: Record<string, string[]> = {
    "MG-CRM-FOOT-CONCRETE": ["MG-SVC-PART-BETONOWA-STOPA-FUNDAMENTOWA"],
    "MG-CRM-POST-BASE-15": ["MG-SVC-PART-PODSTAWA-SLUPA-15X15"],
    "MG-CRM-POST-BASE-HIDDEN": ["MG-SVC-PART-PODSTAWA-SLUPA-UKRYTA"],
    "MG-CRM-GUTTER-CONNECTOR": ["MG-SVC-PART-LACZNIK-RYNNY", "MG-SVC-PART-LACZNIK-RYNNY-PRO-PLUS"],
    "MG-CRM-HANDLE-ONE": ["MG-SVC-PART-UCHWYT-DO-SZYB-SCIENNYCH"],
    "MG-CRM-BRUSH-ONE": ["MG-SVC-PART-SZCZOTKA-PRZECIWKURZOWA"],
    "MG-CRM-DRAINAGE": ["MG-SVC-PART-ODWODNIENIE-SITKO-RURA-KOLANKO"],
  };
  return parts[sku] ?? [];
}

interface Product { id: number | string; code?: string; xmlId?: string; name?: string; active?: string | boolean; iblockSectionId?: number | string; measure?: number | string }
interface Price { id: number | string; productId: number | string; catalogGroupId: number | string; price: number | string; currency: string }
interface Desired { sku: string; name: string; priceGross: number; currency: string; family?: string }
interface Inventory { iblockId: number; basePriceTypeId: number; products: Product[]; prices: Price[] }

function makePlan(desired: Desired[], inventory: Inventory) {
  if (!goodId(inventory.iblockId) || !goodId(inventory.basePriceTypeId)) throw new Error("Invalid catalog/price type ID");
  const productBySku = new Map<string, Map<number, Product>>();
  const productIds = new Set<number>();
  for (const p of inventory.products) {
    const id = Number(p.id);
    if (!goodId(p.id) || productIds.has(id)) throw new Error("Invalid/duplicate portal product ID");
    productIds.add(id);
    for (const key of new Set([skuKey(p.code), skuKey(p.xmlId)])) {
      if (!key.startsWith("MG-")) continue;
      const matches = productBySku.get(key) ?? new Map<number, Product>();
      matches.set(id, p);
      productBySku.set(key, matches);
    }
  }
  const pricesByProduct = new Map<number, Price[]>();
  const priceIds = new Set<number>();
  for (const p of inventory.prices) {
    if (Number(p.catalogGroupId) !== Number(inventory.basePriceTypeId)) throw new Error("Unexpected price type in inventory");
    if (!goodId(p.id) || !goodId(p.productId) || priceIds.has(Number(p.id))) throw new Error("Invalid/duplicate portal price ID");
    priceIds.add(Number(p.id));
    const prices = pricesByProduct.get(Number(p.productId)) ?? [];
    prices.push(p);
    pricesByProduct.set(Number(p.productId), prices);
  }
  const byKey = (key: string) => [...(productBySku.get(key)?.values() ?? [])];
  function describe(p: Product) {
    return {
      productId: Number(p.id), code: p.code ?? null, xmlId: p.xmlId ?? null,
      portalName: p.name ?? null, active: p.active ?? null, sectionId: p.iblockSectionId ?? null,
      measure: p.measure ?? null,
      prices: (pricesByProduct.get(Number(p.id)) ?? []).map(x => ({priceId:Number(x.id), price:x.price, currency:x.currency})),
    };
  }
  const keys = new Set<string>();
  const matchedIds = new Set<number>();
  const actions = desired.map(d => {
    const sku = skuKey(d.sku);
    if (!sku.startsWith("MG-") || keys.has(sku) || !Number.isFinite(d.priceGross) || d.priceGross <= 0 || d.currency !== "PLN") {
      throw new Error(`Invalid source product: ${sku}`);
    }
    keys.add(sku);
    const base = { sku, name: d.name, family: d.family ?? null, newPriceNet: d.priceGross, currency: d.currency };
    const matches = byKey(sku);
    if (!matches.length) {
      const aliases = suggestedAliases(sku);
      const candidates = aliases.flatMap(alias => byKey(alias).map(p => ({suggestedSku:alias, ...describe(p)})));
      return {...base, kind: candidates.length ? "alias_review" : "missing", candidates};
    }
    for (const p of matches) matchedIds.add(Number(p.id));
    if (matches.length !== 1) return {...base, kind:"blocked", reason:"duplicate_sku", candidates:matches.map(describe)};
    const p = matches[0];
    const code = skuKey(p.code), xmlId = skuKey(p.xmlId);
    const details = describe(p);
    if ((code.startsWith("MG-") && code !== sku) || (xmlId && xmlId !== sku)) return {...base, ...details, kind:"blocked", reason:"code_xmlid_conflict"};
    if (p.active !== "Y" && p.active !== true) return {...base, ...details, kind:"blocked", reason:"inactive_or_unknown"};
    const prices = pricesByProduct.get(Number(p.id)) ?? [];
    if (prices.length !== 1) return {...base, ...details, kind:"blocked", reason:prices.length ? "multiple_base_prices" : "no_base_price"};
    const price = prices[0];
    const oldPriceNet = Number(price.price);
    if ((typeof price.price !== "number" && typeof price.price !== "string") || String(price.price).trim() === "" || !Number.isFinite(oldPriceNet) || oldPriceNet < 0 || price.currency !== "PLN") {
      return {...base, ...details, kind:"blocked", reason:"invalid_price_or_currency"};
    }
    const diff = Math.round((d.priceGross - oldPriceNet)*100)/100;
    return {...base, ...details, kind:oldPriceNet === d.priceGross ? "same" : "price_change", priceId:Number(price.id), oldPriceNet, deltaNet:diff};
  });
  const extras = inventory.products.filter(p => !matchedIds.has(Number(p.id)) && [p.code,p.xmlId].some(k=>skuKey(k).startsWith("MG-"))).map(describe);
  const duplicatePortalSkus = [...productBySku.entries()].filter(([,v])=>v.size>1).map(([k])=>k);
  const counts: Record<string,number> = { price_change:0, same:0, alias_review:0, missing:0, blocked:0 };
  for (const a of actions) counts[a.kind]++;
  return { counts, duplicatePortalSkus, actions, extras };
}

async function main() {
  const before = snapshotState();
  const source = buildPublishedCatalogProducts(cwd);
  const env = loadProvisionerEnv();
  const manager = new Bitrix24FullCatalogManager(cwd, env);
  console.log("PRICE PLAN: reading live catalog (read only)...");
  const inventory = await manager.readPriceInventory() as Inventory;
  const after = snapshotState();
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Source snapshots changed during planning; rerun");
  const plan = makePlan(source.products, inventory);
  const report = {
    generatedAt: new Date().toISOString(), mode:"READ_ONLY_NOT_APPROVED",
    portalHost: new URL(env.webhookUrl).hostname, priceMode:"net", currency:"PLN",
    iblockId: inventory.iblockId, basePriceTypeId: inventory.basePriceTypeId,
    sources: before, sourceSummary: source.summary, portalProductCount:inventory.products.length,
    ...plan,
  };
  const reportDir = path.resolve(cwd, "../.local/pricing");
  fs.mkdirSync(reportDir, {recursive:true});
  const output = path.join(reportDir, `bitrix-price-plan-${report.generatedAt.replace(/[:.]/g,"-")}.json`);
  fs.writeFileSync(output, JSON.stringify(report,null,2)+"\n", {encoding:"utf8",flag:"wx"});
  console.log(JSON.stringify({
    portalHost:report.portalHost, iblockId:report.iblockId, basePriceTypeId:report.basePriceTypeId,
    sourceProducts:source.products.length, portalProducts:report.portalProductCount,
    ...plan.counts, extraManagedProducts:plan.extras.length, duplicatePortalSkus:plan.duplicatePortalSkus.length,
    report:output,
  },null,2));
  console.log("READ ONLY - no Bitrix24 updates. Alias suggestions are not approved.");
}
main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message.replace(/https?:\/\/[^\s"']+/gi,"[URL redacted]"));
  process.exitCode = 1;
});
