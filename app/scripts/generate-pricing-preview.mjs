import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const names = ['published-pricing.generated.json','crm-core-products.generated.json','crm-catalog-addons.generated.json'];
const depths = [300,350,400,450,500,550,600];
const widths = [306,406,506,606,706,806,906,1006,1106,1206];
const dims = depths.flatMap(d => widths.map(w => `${d}x${w}`));
const types = ['terrace_roof','winter_garden'];
const lightingPolicy = JSON.parse(fs.readFileSync(new URL('../src/domain/lighting-auto-quote-policy.json',import.meta.url),'utf8'));
export function lightingAutoQuote(length,width) {
  return Object.fromEntries(['point','cct','rgb_cct'].map(k=>[k,lightingPolicy.widths.includes(width)&&lightingPolicy.depths[k].includes(length)]));
}
const glassKeys = new Set(['terraceRoofGlass','winterGardenGlass','roofGlassColor']);
const families = {
  terrace_roof_poly:'terraceRoofPoly', terrace_roof_glass:'terraceRoofGlass',
  winter_garden_poly:'winterGardenPoly', winter_garden_glass:'winterGardenGlass',
  installation_terrace_roof:'installationTerraceRoof', installation_winter_garden:'installationWinterGarden',
  roof_poly_color_surcharge:'roofPolyColor', roof_glass_color_surcharge:'roofGlassColor',
  wall_glass_tint_surcharge:'wallGlassTint', led_rgb_cct:'ledRgbCct'
};
const prefixes = {terrace_roof_poly:'TR-BASE',terrace_roof_glass:'TR-GLASS',winter_garden_poly:'WG-BASE',winter_garden_glass:'WG-GLASS',installation_terrace_roof:'INSTALL-TR',installation_winter_garden:'INSTALL-WG',roof_poly_color_surcharge:'ROOF-POLY-COLOR-SUR',roof_glass_color_surcharge:'ROOF-GLASS-COLOR-SUR',wall_glass_tint_surcharge:'WALL-GLASS-TINT-SUR',led_rgb_cct:'LED-RGB-CCT'};
const addonFields = {zipRightNet:'zipSide',zipLeftNet:'zipSide',zipFrontNet:'zipFront',awningNet:'awning',levelingProfileNet:'foundation',ledSpotNet:'ledPoint',ledStripNet:'ledCct',brushesNet:'brushes',handlesNet:'handles',carriersNet:'carriers'};
const addonKeys = [...new Set(Object.values(addonFields))];
const coreKeys = Object.values(families);
const zeroFields = ['wallGlassMilkyNet','roofPolycarbonateClearNet','roofGlassMilkyNet','ledCobNet'];
const status = 'PREVIEW - DO NOT SYNC TO BITRIX';
const fail = msg => { throw new Error(msg); };
const check = (v,msg) => { if(!v) fail(msg); };
const hash = b => createHash('sha256').update(b).digest('hex');
const json = d => JSON.stringify(d,null,2)+'\n';
const parse = b => JSON.parse(b.toString('utf8').replace(/^\uFEFF/,''));
const price = (v,label,zero=false) => {check(Number.isSafeInteger(v) && v >= 0 && (zero?v===0:v>0), `Invalid NET price ${label}: ${v}`);return v;};
function exactKeys(obj,keys,label) {
  check(obj && typeof obj==='object' && !Array.isArray(obj),`Missing object ${label}`);
  check(isDeepStrictEqual(Object.keys(obj).sort(),[...keys].sort()),`Unexpected or missing keys in ${label}`);
}
function unique(values,label) {check(new Set(values).size===values.length,`Duplicate ${label}`);}
function rowKey(r) {return `${r.productType}|${r.lengthCm}x${r.widthCm}`;}
function allowedGlass(k) {return Number(k.split('x')[0])<=500;}
function validateMaster(m) {
  exactKeys(m,['metadata','core','addons','crmAddonPrices'],'master');
  exactKeys(m.metadata,['version','status','currency','priceMode'],'master metadata');
  check(m.metadata.status==='PREVIEW_NOT_APPROVED_DO_NOT_SYNC' && m.metadata.currency==='PLN' && m.metadata.priceMode==='net','Master must be PREVIEW, NET, PLN');
  check(typeof m.metadata.version==='string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(m.metadata.version),'Invalid master version');
  for(const [group,keys] of [[m.core,coreKeys],[m.addons,addonKeys]]) {
    exactKeys(group,keys,'price families');
    for(const key of keys) {
      exactKeys(group[key],dims,key);
      for(const d of dims) price(group[key][d],`${key}/${d}`,glassKeys.has(key)&&!allowedGlass(d));
    }
  }
}
export function generate(master, templates, generatedAt = new Date().toISOString()) {
  validateMaster(master);
  exactKeys(lightingPolicy,['widths','depths'],'lighting policy');
  exactKeys(lightingPolicy.depths,['point','cct','rgb_cct'],'lighting policy depths');
  check(Array.isArray(lightingPolicy.widths)&&isDeepStrictEqual(lightingPolicy.widths,widths),'Invalid LED width grid');
  for(const [kind,values] of Object.entries(lightingPolicy.depths)) {
    check(Array.isArray(values)&&values.length>0&&values.every(v=>depths.includes(v)),`Invalid LED depths ${kind}`);
    unique(values,`LED depths ${kind}`);
  }
  const [pub,core,addons] = structuredClone(templates);
  check(pub.metadata.currency==='PLN' && pub.metadata.defaultPriceMode==='net' && pub.metadata.canonicalPriceMode==='net','Invalid published template price mode');
  for(const k of ['defaultVatRate','websiteDefaultVatRate','bitrixDefaultVatRate']) check(pub.metadata[k]===8,`Unexpected ${k}`);
  for(const t of [core,addons]) check(t.metadata.currency==='PLN' && t.metadata.priceMode==='net','Invalid CRM template price mode');
  const rowsExpected=types.flatMap(t=>dims.map(d=>`${t}|${d}`));
  for(const [label,rows] of [['dimensions',pub.dimensions],['priceMatrix',pub.priceMatrix]]) {
    check(Array.isArray(rows)&&rows.length===140,`Invalid ${label} count`);
    unique(rows.map(rowKey),label);check(isDeepStrictEqual(rows.map(rowKey).sort(),rowsExpected.sort()),`Invalid ${label} grid`);
    check(rows.every(r=>r.active===true),`Inactive ${label} row`);
  }
  check(core.products.length===640 && addons.products.length===67,'Invalid CRM product counts');
  unique([...core.products,...addons.products].map(p=>p.sku),'CRM SKU');
  const expectedCore=Object.entries(families).flatMap(([f,k])=>dims.filter(d=>!glassKeys.has(k)||allowedGlass(d)).map(d=>`${f}|${d}`));
  check(isDeepStrictEqual(core.products.map(p=>`${p.family}|${p.dimensionKey}`).sort(),expectedCore.sort()),'Unexpected core family/dimension grid');
  for(const p of core.products){const [d,w]=p.dimensionKey.split('x');check(p.currency==='PLN' && p.sku===`MG-${prefixes[p.family]}-D${d}-W${w}`,`Invalid core SKU/currency: ${p.sku}`);p.priceNet=master.core[families[p.family]][p.dimensionKey];}
  exactKeys(master.crmAddonPrices,addons.products.map(p=>p.sku),'CRM-only prices');
  for(const p of addons.products){check(p.currency==='PLN' && p.sku.startsWith('MG-CRM-'),'Invalid CRM-only SKU/currency');p.priceNet=price(master.crmAddonPrices[p.sku],p.sku);}
  for(const r of pub.priceMatrix) {
    const d=`${r.lengthCm}x${r.widthCm}`,glass=allowedGlass(d),c=master.core,a=master.addons;
    check(r.availability?.roofGlass===glass && r.availability?.ledRgb===false,`Availability mismatch ${rowKey(r)}`);
    // Legacy ledRgb/ledCobNet are deliberately retained.
    r.availability.ledAutoQuote=lightingAutoQuote(r.lengthCm,r.widthCm);
    const construction=c.terraceRoofPoly[d]+c.installationTerraceRoof[d];
    const winter=c.winterGardenPoly[d]+c.installationWinterGarden[d];
    const roofDiff=r.productType==='terrace_roof'?c.terraceRoofGlass[d]-c.terraceRoofPoly[d]:c.winterGardenGlass[d]-c.winterGardenPoly[d];
    const net={constructionNet:construction,wallGlassClearNet:winter-construction,wallGlassTintedNet:c.wallGlassTint[d],roofPolycarbonateMilkyNet:c.roofPolyColor[d],roofPolycarbonateGreyNet:c.roofPolyColor[d],roofPolycarbonateSmokeNet:c.roofPolyColor[d],roofGlassClearNet:glass?roofDiff:0,roofGlassTintedNet:c.roofGlassColor[d]};
    for(const [field,key] of Object.entries(addonFields))net[field]=a[key][d];
    for(const field of zeroFields)net[field]=0;
    const expectedFields=Object.keys(net).flatMap(k=>[k,k.replace(/Net$/,'Gross')]);
    check(isDeepStrictEqual(Object.keys(r).filter(k=>/(Net|Gross)$/.test(k)).sort(),expectedFields.sort()),`Unknown or absent price field ${rowKey(r)}`);
    for(const [field,value] of Object.entries(net)) {
      const shouldZero=zeroFields.includes(field)||(!glass&&['roofGlassClearNet','roofGlassTintedNet'].includes(field));
      r[field]=price(value,`${rowKey(r)} ${field}`,shouldZero);
      r[field.replace(/Net$/,'Gross')]=Math.round(value*1.08);
    }
    r.sourceAuditStatus = `PREVIEW canonical ${master.metadata.version}`;
  }
  // Never release or install a generated snapshot. The existing metadata is retained apart from preview/version/source labels.
  pub.metadata={...pub.metadata,pricingVersion:master.metadata.version,status,importedAt:generatedAt,source:'MoonGlass canonical sales master',notes:'PREVIEW – canonical sales prices; not approved for publication or sync.'};
  core.metadata={...core.metadata,version:`${master.metadata.version}-core`,status,generatedAt,source:'MoonGlass canonical sales master'};
  addons.metadata={...addons.metadata,version:`${master.metadata.version}-crm-addons`,status,generatedAt,source:'MoonGlass canonical sales master'};
  return [pub,core,addons];
}
function cli() {
  const args=process.argv.slice(2);check(args.length===4&&args[0]==='--input'&&args[2]==='--run','Usage: node scripts/generate-pricing-preview.mjs --input <sales-master.json> --run <unique-name>');
  const cwd=process.cwd(), run=args[3];check(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,80}$/.test(run),'Invalid run name');
  const root=path.resolve(cwd,'../.local/pricing'), dir=path.join(root,'generated-previews',run);
  const masterBytes=fs.readFileSync(path.resolve(cwd,args[1]));
  const templateBytes=names.map(n=>fs.readFileSync(path.join(cwd,'src/data/pricing/glass-system',n)));
  const templates=templateBytes.map(parse), output=generate(parse(masterBytes),templates);
  const result=output.map(json);
  const counts={coreChanged:output[1].products.filter((p,i)=>p.priceNet!==templates[1].products[i].priceNet).length,crmAddonChanged:output[2].products.filter((p,i)=>p.priceNet!==templates[2].products[i].priceNet).length,publishedNetFieldsChanged:output[0].priceMatrix.reduce((n,r,i)=>n+Object.keys(r).filter(k=>k.endsWith('Net')&&r[k]!==templates[0].priceMatrix[i][k]).length,0)};
  const manifest={mode:'PREVIEW_ONLY_NOT_INSTALLED',masterSha256:hash(masterBytes),counts,files:names.map((name,i)=>({name,templateSha256:hash(templateBytes[i]),sha256:hash(result[i])}))};
  fs.mkdirSync(path.dirname(dir),{recursive:true});fs.mkdirSync(dir);
  for(let i=0;i<names.length;i++)fs.writeFileSync(path.join(dir,names[i]),result[i],{flag:'wx'});
  fs.writeFileSync(path.join(dir,'manifest.json'),json(manifest),{flag:'wx'});
  console.log(JSON.stringify({...manifest,output:dir},null,2));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {try{cli();}catch(e){console.error(e.message);process.exitCode=1;}}
