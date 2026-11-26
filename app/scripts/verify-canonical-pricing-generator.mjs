import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {generate} from './generate-pricing-preview.mjs';
const names=['published-pricing.generated.json','crm-core-products.generated.json','crm-catalog-addons.generated.json'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const input=process.argv[2];if(!input)throw Error('Pass baseline sales master JSON path');
const master=read(input),templates=names.map(n=>read(path.join('src/data/pricing/glass-system',n)));
let count=0;
function test(label,fn){fn();count++;console.log('PASS '+label);}
const generateAt=(m=master,t=templates)=>generate(m,t,'2026-11-25T00:00:00.000Z');
function data(t){const c=structuredClone(t);for(const x of c)delete x.metadata;for(const r of c[0].priceMatrix)delete r.sourceAuditStatus;return c;}
function bad(label,change){test(label,()=>{const m=structuredClone(master),t=structuredClone(templates);change(m,t);assert.throws(()=>generateAt(m,t));});}
test('all baseline prices and non-metadata data preserved except explicit LED policy',()=>{
  const generated=data(generateAt()), existing=data(templates);
  for(const group of [generated,existing])for(const r of group[0].priceMatrix)delete r.availability.ledAutoQuote;
  assert.deepEqual(generated,existing);
});
test('140 LED policy rows agree with reviewed commercial allowlist',()=>{
  const [p]=generateAt(); const counts={point:0,cct:0,rgb_cct:0};
  for(const r of p.priceMatrix){
    assert.equal(r.availability.ledRgb,false);
    assert.equal(r.ledCobNet,0);assert.equal(r.ledCobGross,0);
    const expected={point:true,cct:r.lengthCm<=500,rgb_cct:r.lengthCm<=400};
    assert.deepEqual(r.availability.ledAutoQuote,expected);
    for(const k of Object.keys(counts))counts[k]+=Number(expected[k]);
  }
  assert.deepEqual(counts,{point:140,cct:100,rgb_cct:60});
});
test('new availability metadata regenerates identically',()=>assert.deepEqual(generateAt(master,generateAt()),generateAt()));
test('deterministic with fixed timestamp',()=>assert.deepEqual(generateAt(),generateAt()));
test('all generated outputs remain PREVIEW',()=>assert.ok(generateAt().every(x=>x.metadata.status==='PREVIEW - DO NOT SYNC TO BITRIX')));
test('material change recalculates construction and glass increments without changing installation',()=>{const m=structuredClone(master);m.core.terraceRoofPoly['300x306']+=100;const [p,c]=generateAt(m);const r=p.priceMatrix.find(x=>x.productType==='terrace_roof'&&x.lengthCm===300&&x.widthCm===306);const base=generateAt()[0].priceMatrix.find(x=>x.productType==='terrace_roof'&&x.lengthCm===300&&x.widthCm===306);assert.equal(r.constructionNet,base.constructionNet+100);assert.equal(r.constructionGross,Math.round((base.constructionNet+100)*1.08));assert.equal(r.wallGlassClearNet,base.wallGlassClearNet-100);assert.equal(r.roofGlassClearNet,base.roofGlassClearNet-100);assert.equal(c.products.find(x=>x.sku==='MG-INSTALL-TR-D300-W306').priceNet,master.core.installationTerraceRoof['300x306']);});
test('CRM addon price applied by exact SKU only',()=>{const m=structuredClone(master);m.crmAddonPrices['MG-CRM-SLIDE-CLEAR-194']+=1;const a=generateAt(m)[2].products;assert.equal(a.find(x=>x.sku==='MG-CRM-SLIDE-CLEAR-194').priceNet,master.crmAddonPrices['MG-CRM-SLIDE-CLEAR-194']+1);assert.equal(a.filter((p,i)=>p.priceNet!==templates[2].products[i].priceNet).length,1);});
bad('reject missing dimension price',m=>delete m.core.terraceRoofPoly['300x306']);
bad('reject extra dimension price',m=>m.core.terraceRoofPoly['700x306']=1);
bad('reject zero available product',m=>m.core.terraceRoofPoly['300x306']=0);
bad('reject nonzero unavailable roof',m=>m.core.terraceRoofGlass['550x306']=100);
bad('reject negative price',m=>m.addons.ledCct['300x306']=-1);
bad('reject missing CRM addon SKU',m=>delete m.crmAddonPrices['MG-CRM-SLIDE-CLEAR-194']);
bad('reject duplicate core SKU',(m,t)=>t[1].products[1].sku=t[1].products[0].sku);
bad('reject changed core SKU',(m,t)=>t[1].products[0].sku='MG-WRONG');
bad('reject changed roof availability',(m,t)=>t[0].priceMatrix[0].availability.roofGlass=false);
bad('reject unknown price field',(m,t)=>t[0].priceMatrix[0].unexpectedNet=1);
bad('reject approved input',m=>m.metadata.status='APPROVED_PRICE_ONLY');
bad('reject invalid currency',m=>m.metadata.currency='EUR');
console.log(`${count} tests PASS; offline only; no writes to active snapshots.`);
