// Read-only reconciliation. Alias matches NEVER become price_change actions.
interface RowPrice { priceId: number; price: number | string; currency: string }
interface Candidate { suggestedSku?: string; productId: number; code?: string | null; xmlId?: string | null; portalName?: string | null; active?: string | boolean | null; sectionId?: number | string | null; measure?: number | string | null; detailText?: string | null; prices: RowPrice[] }
interface Action { sku: string; name: string; family?: string | null; newPriceNet: number; currency: string; kind: string; productId?: number; candidates?: Candidate[] }
interface Entry { sourceSku: string; sourceName: string; family: string; proposedPriceNet: number; candidates: Candidate[]; decision: string; scopeCheck: string; sourceEvidence: {sheet: string; cell: string} }
interface Registry { status: string; portalHost: string; iblockId: number; basePriceTypeId: number; policy: {noPortalWrites: boolean; noAutomaticCreation: boolean; noAutomaticAliasWrites: boolean}; entries: Entry[]; preserveExistingExtras: {sku:string; productId:number; prices:RowPrice[]}[] }
interface Context {portalHost:string; iblockId:number; basePriceTypeId:number}
interface RawPlan<A extends Action> {actions:A[]; extras:Candidate[]; counts:Record<string,number>; duplicatePortalSkus:string[]}
const key = (v:unknown) => String(v ?? "").trim().toUpperCase();
const id = (v:unknown) => Number.isSafeInteger(Number(v)) && Number(v)>0;
function requireOk(ok:unknown, message:string): asserts ok { if (!ok) throw new Error(`Alias review blocked: ${message}`); }
function sameIdentity(a:Candidate,b:Candidate) {
  return a.productId === b.productId && a.xmlId === b.xmlId && a.code === b.code && a.portalName === b.portalName && a.active === b.active && String(a.sectionId) === String(b.sectionId) && String(a.measure) === String(b.measure);
}
function validPrice(p:RowPrice) {return (typeof p.price === "number" || typeof p.price === "string") && id(p.priceId) && p.currency === "PLN" && String(p.price).trim() !== "" && Number.isFinite(Number(p.price)) && Number(p.price)>=0;}
function samePriceIds(a:RowPrice[],b:RowPrice[]) {
  return a.length===b.length && a.every(p=>validPrice(p) && b.some(q=>q.priceId===p.priceId && q.currency===p.currency));
}
export function reconcileAliasReview<A extends Action>(raw:RawPlan<A>, reg:Registry, ctx:Context) {
  requireOk(reg.status === "LOCAL_READ_ONLY_SCOPE_REVIEW" && reg.policy.noPortalWrites === true && reg.policy.noAutomaticCreation === true && reg.policy.noAutomaticAliasWrites === true, "registry policy");
  requireOk(reg.portalHost===ctx.portalHost && Number(reg.iblockId)===Number(ctx.iblockId) && Number(reg.basePriceTypeId)===Number(ctx.basePriceTypeId), "portal/catalog/price type mismatch");
  requireOk(raw.duplicatePortalSkus.length===0 && raw.counts.blocked===0, "base plan has blocks or duplicate SKUs");
  const entries = new Map(reg.entries.map(e=>[e.sourceSku,e]));
  requireOk(reg.entries.length===67 && entries.size===67, "registry coverage");
  const managed = raw.actions.filter(a=>a.sku.startsWith("MG-CRM-"));
  requireOk(managed.length===67 && new Set(managed.map(a=>a.sku)).size===67 && managed.every(a=>entries.has(a.sku)), "source addon coverage");
  const extras = new Map(raw.extras.map(e=>[e.productId,e]));
  requireOk(extras.size===raw.extras.length, "duplicate extra product ID");
  const service = raw.extras.filter(e=>key(e.xmlId).startsWith("MG-SVC-") || key(e.code).startsWith("MG-SVC-"));
  requireOk(service.length===55 && reg.preserveExistingExtras.length===55 && new Set(reg.preserveExistingExtras.map(e=>e.productId)).size===55, "service inventory changed");
  for (const e of reg.preserveExistingExtras) {
    const current=extras.get(e.productId);
    requireOk(current && key(current.xmlId)===e.sku && samePriceIds(current.prices,e.prices), `preserved product changed: ${e.sku}`);
  }
  const reserved = new Set(raw.actions.filter(a=>a.productId!==undefined).map(a=>a.productId));
  const mappedIds=new Set<number>();
  const actions=raw.actions.map(a=>{
    const e=entries.get(a.sku);
    if (!e) return a;
    requireOk(a.name===e.sourceName && a.family===e.family && a.currency==="PLN" && a.newPriceNet===e.proposedPriceNet, `source changed: ${a.sku}`);
    requireOk(a.kind===(e.candidates.length?"alias_review":"missing"), `direct match or unexpected state: ${a.sku}`);
    const candidates=a.candidates ?? [];
    requireOk(candidates.length===e.candidates.length, `candidate count changed: ${a.sku}`);
    for (const expected of e.candidates) {
      const c=candidates.find(x=>x.suggestedSku===expected.suggestedSku);
      requireOk(c && c.suggestedSku===c.xmlId && key(c.xmlId).startsWith("MG-SVC-") && sameIdentity(c,expected) && c.active==="Y" && c.prices.length===1 && samePriceIds(c.prices,expected.prices) && extras.has(c.productId) && !reserved.has(c.productId), `candidate identity/price changed: ${a.sku}`);
    }
    if (e.decision==="DEFER_CATALOG_EXTENSION") {requireOk(candidates.length===0,`deferred candidate: ${a.sku}`);return {...a, catalogDecision:e.decision, writeEligible:false};}
    if (e.decision==="AMBIGUOUS_KEEP_SEPARATE") {requireOk(a.sku==="MG-CRM-GUTTER-CONNECTOR" && candidates.length===2, "unexpected ambiguity");return {...a,catalogDecision:e.decision,writeEligible:false};}
    requireOk(e.decision==="DOCUMENT_MATCH_PENDING_FULL_SCOPE" && candidates.length===1, `unapproved registry decision: ${a.sku}`);
    const c=candidates[0]; requireOk(!mappedIds.has(c.productId), `duplicate mapped target: ${c.productId}`); mappedIds.add(c.productId);
    const price=c.prices[0]; const oldPriceNet=Number(price.price);
    return {...a,kind:oldPriceNet===a.newPriceNet?"mapped_same":"mapped_price_review",targetSku:c.xmlId,productId:c.productId,priceId:price.priceId,oldPriceNet,deltaNet:Math.round((a.newPriceNet-oldPriceNet)*100)/100,scopeStatus:e.decision,scopeCheck:e.scopeCheck,sourceEvidence:e.sourceEvidence,portalDetailText:c.detailText??null,writeEligible:false};
  });
  requireOk(mappedIds.size===42, "mapping count changed");
  const counts:Record<string,number>={price_change:0,same:0,mapped_same:0,mapped_price_review:0,alias_review:0,missing:0,blocked:0};
  for(const a of actions){requireOk(Object.hasOwn(counts,a.kind),`unknown kind ${a.kind}`);counts[a.kind]++;}
  return {...raw,actions,counts,extras:raw.extras.filter(e=>!mappedIds.has(e.productId)),preservedExistingServiceProducts:service,aliasWritesAllowed:false};
}
