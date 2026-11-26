import { createHash } from 'node:crypto';
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
export const skuKey = v => String(v ?? '').trim().toUpperCase();
export const id = v => { const n = Number(v); assert((typeof v === 'number' || typeof v === 'string') && /^\d+$/.test(String(v)) && Number.isSafeInteger(n) && n > 0, 'Invalid ID'); return n; };
export const cents = v => { assert((typeof v === 'number' || typeof v === 'string') && /^\d+(\.\d{1,2})?$/.test(String(v)), 'Invalid price'); const n = Math.round(Number(v)*100); assert(Number.isSafeInteger(n), 'Invalid price precision'); return n; };
export const eq = (a,b,msg) => assert(JSON.stringify(a) === JSON.stringify(b), msg);
const kinds = ['price_change','same','mapped_same','mapped_price_review','alias_review','missing','blocked'];
export const sourceNames = ['published-pricing.generated.json','crm-core-products.generated.json','crm-catalog-addons.generated.json'];
export function validatePlan(p) {
  assert(p.mode === 'READ_ONLY_MAPPED_NOT_APPROVED' && p.portalHost === 'moonglass.bitrix24.pl' && p.priceMode === 'net' && p.currency === 'PLN' && p.aliasWritesAllowed === false, 'Unexpected plan mode/portal/currency');
  id(p.iblockId); id(p.basePriceTypeId);
  assert(Array.isArray(p.sources) && p.sources.length === 3, 'Invalid sources');
  eq(p.sources.map(s=>s.name),sourceNames,'Wrong source names');
  for (const s of p.sources) assert(s.priceMode === 'net' && s.currency === 'PLN' && /^[a-f0-9]{64}$/.test(s.sha256), 'Invalid source metadata');
  assert(/^[a-f0-9]{64}$/.test(p.registrySha256), 'Invalid registry hash');
  assert(Array.isArray(p.actions) && Array.isArray(p.preservedExistingServiceProducts) && Array.isArray(p.duplicatePortalSkus) && p.duplicatePortalSkus.length === 0, 'Invalid plan/duplicate SKUs');
  const counts = Object.fromEntries(kinds.map(k=>[k,0])); const keys=new Set(), ids=new Set(), prices=new Set();
  for (const a of p.actions) {
    assert(kinds.includes(a.kind) && /^MG-[A-Z0-9-]+$/.test(a.sku) && !keys.has(a.sku) && a.currency === 'PLN' && cents(a.newPriceNet)>0, `Invalid source action ${a.sku}`); keys.add(a.sku); counts[a.kind]++;
    if (a.kind === 'same' || a.kind === 'price_change') {
      assert(!a.sku.startsWith('MG-CRM-') && !a.sku.startsWith('MG-SVC-') && a.writeEligible !== false && skuKey(a.xmlId)===a.sku && (!skuKey(a.code).startsWith('MG-') || skuKey(a.code)===a.sku), `Not direct operational SKU: ${a.sku}`);
      assert(a.active === 'Y' || a.active === true, `Inactive ${a.sku}`);
      const pid=id(a.productId), rid=id(a.priceId);
      assert(!ids.has(pid) && !prices.has(rid), 'Repeated direct identity'); ids.add(pid); prices.add(rid);
      assert(a.prices.length===1 && id(a.prices[0].priceId)===rid && a.prices[0].currency==='PLN' && cents(a.prices[0].price)===cents(a.oldPriceNet), `Invalid original price ${a.sku}`);
      const delta=cents(a.newPriceNet)-cents(a.oldPriceNet);
      assert((a.kind==='price_change')===(delta!==0) && Math.round(a.deltaNet*100)===delta, `Invalid delta ${a.sku}`);
    } else assert(a.writeEligible===false || a.writeEligible===undefined, `Unexpected write permission ${a.sku}`);
  }
  for (const k of kinds) assert(counts[k]===p.counts[k], `Invalid count ${k}`);
  assert(counts.blocked===0 && counts.mapped_price_review===0 && p.actions.length===p.sourceSummary.products, 'Plan has blocks or unresolved mapped price changes');
  for (const a of p.preservedExistingServiceProducts) { const pid=id(a.productId); assert(skuKey(a.xmlId).startsWith('MG-SVC-') && !ids.has(pid), 'Service identity overlaps direct'); ids.add(pid); for (const q of a.prices) { const rid=id(q.priceId); assert(!prices.has(rid)&&q.currency==='PLN','Invalid preserved price'); prices.add(rid); cents(q.price); } }
  const serviceById=new Map(p.preservedExistingServiceProducts.map(a=>[id(a.productId),a])); const mappedIds=new Set();
  for(const a of p.actions.filter(x=>x.kind==='mapped_same')) { const target=serviceById.get(id(a.productId)); assert(target&&!mappedIds.has(id(a.productId))&&a.writeEligible===false&&skuKey(target.xmlId)===a.targetSku&&target.prices.length===1&&id(target.prices[0].priceId)===id(a.priceId)&&cents(target.prices[0].price)===cents(a.newPriceNet)&&cents(a.oldPriceNet)===cents(a.newPriceNet),'Invalid read-only mapped target'); mappedIds.add(id(a.productId)); }
  return p.actions.filter(a=>a.kind==='price_change');
}
export function checkSource(p, sources, registryHash, products) {
  eq(p.sources,sources,'Source snapshots changed; new plan required'); assert(p.registrySha256===registryHash,'Registry changed');
  const expected=new Map(p.actions.map(a=>[a.sku,a])); const seen=new Set();
  for (const x of products) { const key=skuKey(x.sku), a=expected.get(key); assert(a && !seen.has(key) && x.currency==='PLN' && cents(x.priceGross)===cents(a.newPriceNet) && (x.family??null)===a.family && x.name===a.name, `Source action mismatch ${key}`); seen.add(key); }
  assert(seen.size===expected.size,'Source product set differs');
}
export function requireReleased(p) { assert(p.sources.every(s=>s.status==='APPROVED_PRICE_ONLY'), 'PREVIEW or unapproved snapshot: writes forbidden'); }
export function pick(p, scope) {
  const changes=validatePlan(p); assert(changes.length>0,'No changes');
  if(scope==='all') return changes;
  const keys=scope.split(','); assert(keys.length && new Set(keys).size===keys.length && keys.every(k=>changes.some(a=>a.sku===k)), 'Scope must be all or exact comma-separated price_change SKUs');
  return changes.filter(a=>keys.includes(a.sku));
}
const nullable = v=>v??null;
export function checkProduct(a,p,iblockId) {
  assert(id(p.id)===id(a.productId) && id(p.iblockId)===id(iblockId),`Product ID/catalog drift ${a.sku??a.xmlId}`);
  for(const [x,y] of [['code','code'],['xmlId','xmlId'],['name','portalName'],['detailText','detailText']]) eq(nullable(p[x]),nullable(a[y]),`Product ${x} drift ${a.sku??a.xmlId}`);
  eq(String(p.active),String(a.active),'Product active drift'); eq(String(p.iblockSectionId??''),String(a.sectionId??''),'Product section drift'); eq(String(p.measure??''),String(a.measure??''),'Product measure drift');
}
export function checkPrice(a,q,group,expected) {
  assert(id(q.id)===id(a.priceId) && id(q.productId)===id(a.productId) && id(q.catalogGroupId)===id(group) && q.currency==='PLN','Price identity/currency drift '+(a.sku??a.xmlId));
  assert(cents(q.price)===cents(expected),'Price drift '+(a.sku??a.xmlId)+': expected '+expected+', found '+q.price);
}
export function checkInventory(p,inventory,changed=new Set()) {
  assert(id(inventory.iblockId)===id(p.iblockId) && id(inventory.basePriceTypeId)===id(p.basePriceTypeId) && inventory.products.length===p.portalProductCount,'Catalog/price type/product count drift');
  const byId=new Map(), keys=new Map(), byProduct=new Map(), priceIds=new Set();
  for(const x of inventory.products) {const pid=id(x.id); assert(!byId.has(pid),'Duplicate product ID'); byId.set(pid,x); for(const k of new Set([skuKey(x.code),skuKey(x.xmlId)])) if(k.startsWith('MG-')) {assert(!keys.has(k),'Duplicate managed SKU '+k);keys.set(k,pid);} }
  for(const q of inventory.prices) {const rid=id(q.id), pid=id(q.productId); assert(!priceIds.has(rid)&&id(q.catalogGroupId)===id(p.basePriceTypeId),'Duplicate price ID/type drift');priceIds.add(rid);const list=byProduct.get(pid)??[];list.push(q);byProduct.set(pid,list);}
  for(const a of p.actions.filter(x=>x.kind==='price_change'||x.kind==='same')) { const x=byId.get(id(a.productId)), list=byProduct.get(id(a.productId))??[]; assert(x&&keys.get(a.sku)===id(a.productId)&&list.length===1,'Direct product/price missing '+a.sku); checkProduct(a,x,p.iblockId); checkPrice(a,list[0],p.basePriceTypeId,changed.has(a.sku)?a.newPriceNet:a.oldPriceNet); }
  for(const a of p.preservedExistingServiceProducts) { const x=byId.get(id(a.productId)), list=byProduct.get(id(a.productId))??[]; assert(x&&keys.get(skuKey(a.xmlId))===id(a.productId)&&list.length===a.prices.length,'Service product/price missing'); checkProduct(a,x,p.iblockId); for(const old of a.prices) {const q=list.find(v=>id(v.id)===id(old.priceId));assert(q,'Service price missing');checkPrice({...a,priceId:old.priceId},q,p.basePriceTypeId,old.price);} }
  const expectedManaged=new Set([...p.actions.filter(a=>a.kind==='price_change'||a.kind==='same').map(a=>a.sku),...p.preservedExistingServiceProducts.map(a=>skuKey(a.xmlId))]);
  assert(keys.size===expectedManaged.size&&[...keys.keys()].every(k=>expectedManaged.has(k)),'Managed SKU set drift');
  return true;
}
export async function executeRows(rows, adapter, log, direction='apply') {
  const from=direction==='apply'?'oldPriceNet':'newPriceNet', to=direction==='apply'?'newPriceNet':'oldPriceNet';
  for(const a of rows) {
    await adapter.check(a,a[from]); // no journal/write if precondition failed
    log({direction,sku:a.sku,event:'intent'}); // durable before sending request
    await adapter.write(a,a[to]); // no automatic retry; outcome may be unknown
    await adapter.check(a,a[to]);
    log({direction,sku:a.sku,event:'verified'});
  }
}
export function journalState(events, rows) {
  const allowed=new Set(rows.map(a=>a.sku)), changed=new Set(); let pending=null, rolling=false;
  for(const e of events) {
    assert(allowed.has(e.sku)&&['apply','rollback'].includes(e.direction)&&['intent','verified'].includes(e.event),'Invalid journal event');
    if(e.direction==='rollback') rolling=true; else assert(!rolling,'Apply after rollback');
    if(e.event==='intent') {assert(!pending && (e.direction==='apply'?!changed.has(e.sku):changed.has(e.sku)),'Invalid intent');pending=e;}
    else {assert(pending&&pending.sku===e.sku&&pending.direction===e.direction,'Invalid verification event'); if(e.direction==='apply')changed.add(e.sku);else changed.delete(e.sku);pending=null;}
  }
  return {changed,pending,rolling};
}
