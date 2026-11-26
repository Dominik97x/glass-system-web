import assert from "node:assert/strict";
import type { StoredCalculatorInquiryLead } from "../src/domain/StoredCalculatorInquiryLead";
import type { ProductConfiguration } from "../src/domain/ProductConfiguration";
import type { CalculatorInquiryRepository } from "../src/inquiries/repositories/CalculatorInquiryRepository";
import type { CalculatorInquiryBitrix24SyncService } from "../src/inquiries/sync/CalculatorInquiryBitrix24SyncService";
import type { Bitrix24Client } from "../src/integrations/bitrix24/Bitrix24Client";

// Fail closed: no production connections, even when .env values exist.
process.env.BITRIX24_ENABLED = "false";
process.env.CALCULATOR_INQUIRY_NOTIFICATIONS = "disabled";
delete process.env.DATABASE_URL;
delete process.env.BITRIX24_WEBHOOK_URL;

async function main() {
  const { DEFAULT_CONFIGURATION } = await import("../src/domain/ProductConfiguration");
  const { CalculatorInquiryService } = await import("../src/inquiries/services/CalculatorInquiryService");
  const { CalculatorInquiryHandler } = await import("../src/inquiries/server/CalculatorInquiryHandler");
  const { CalculatorInquiryQuoteService } = await import("../src/inquiries/server/CalculatorInquiryQuoteService");
  const { validateCalculatorInquirySubmission } = await import("../src/inquiries/validators/calculator-inquiry-validator");
  const { mapDatabaseRowToStoredCalculatorInquiryLead } = await import("../src/inquiries/repositories/DatabaseCalculatorInquiryRepository");
  const { Bitrix24InquiryProductRowBuilder } = await import("../src/integrations/bitrix24/Bitrix24InquiryProductRowBuilder");
  const { readProductConfigurationFromInquiry } = await import("../src/integrations/bitrix24/CalculatorInquiryConfigurationReader");
  const { createCalculatorInquiryNotificationMessage, createCalculatorInquiryCustomerMessage } = await import("../src/inquiries/notifications/CalculatorInquiryNotificationMessage");
  const { hasDetailedQuoteFinancials, recalculateQuoteSnapshotForVat } = await import("../src/lib/quote-snapshot");
  const { createCalculatorInquiryQuotePdf } = await import("../src/inquiries/pdf/CalculatorInquiryQuotePdf");
  const customer = {name:"OFFLINE TEST",email:"test@example.invalid",phone:"500000000",message:"Test only"};
  const saved = new Map<string, StoredCalculatorInquiryLead>();
  let notifications = 0, syncCalls = 0;
  const repo: CalculatorInquiryRepository = {
    async save(lead) { saved.set(lead.id, JSON.parse(JSON.stringify(lead))); },
    async findAll() { return [...saved.values()]; },
    async findById(id) { return saved.get(id) ?? null; },
    async updateStatus() { throw Error("Unexpected status update"); }
  };
  const fakeSync = {
    async syncInquiry(id: string) { assert.ok(saved.has(id)); syncCalls++; return {status:"skipped" as const}; }
  } as unknown as CalculatorInquiryBitrix24SyncService;
  const trusted = new CalculatorInquiryQuoteService();
  const handler = new CalculatorInquiryHandler(repo, {
    async notify(lead) { assert.ok(saved.has(lead.id)); notifications++; return {internalEmailSent:false, customerEmailSent:false}; }
  }, trusted, fakeSync);
  // Simulate the route's validation and handler, not Next middleware / rate limit.
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "/api/inquiries");
    assert.equal(init?.method, "POST");
    const payload = JSON.parse(String(init?.body));
    const validation = validateCalculatorInquirySubmission({...payload, totalGross: 1, quote:{totalGross:1}});
    if (!validation.success) return Response.json({success:false,message:validation.message},{status:400});
    return Response.json(await handler.handle(validation.submission),{status:201});
  };
  const submitter = new CalculatorInquiryService();
  const skuIds = new Map<string,number>();
  const fakeClient = {
    async call(method: string, payload: {filter?: {xmlId?:string}}) {
      if (method === "catalog.catalog.list") return {result:{catalogs:[{iblockId:15}]}};
      assert.equal(method,"catalog.product.list");
      const sku = payload.filter?.xmlId;
      assert.ok(sku?.startsWith("MG-"));
      if (!skuIds.has(sku!)) skuIds.set(sku!, 10000+skuIds.size);
      return {result:{products:[{id:skuIds.get(sku!),xmlId:sku,iblockId:15}]}};
    }
  } as unknown as Bitrix24Client;
  const builder = new Bitrix24InquiryProductRowBuilder(fakeClient);
  const money = (n:number) => Math.round((n+Number.EPSILON)*100)/100;
  let rgbLead: StoredCalculatorInquiryLead | undefined;
  for (const productType of ["terrace_roof","winter_garden"] as const) {
    for (const kind of ["POINT","CCT","RGB-CCT"] as const) {
      const configuration: ProductConfiguration = {...DEFAULT_CONFIGURATION,productType,
        walls: productType==="winter_garden"?"glass_clear":"none",
        hasLevelingProfile:productType==="winter_garden",
        hasLed:kind==="POINT",hasCob:kind==="CCT",hasRgbCct:kind==="RGB-CCT"};
      const result = await submitter.submit({customer,configuration});
      assert.equal(result.success,true);
      assert.ok(result.inquiryId);
      const lead = saved.get(result.inquiryId)!;
      assert.ok(lead);
      // Exercise the production DB decoder with a synthetic JSONB row.
      const restored = mapDatabaseRowToStoredCalculatorInquiryLead({
        id:lead.id,source:"calculator",status:"new",created_at:lead.createdAt,received_at:lead.receivedAt,
        customer_name:customer.name,customer_email:customer.email,customer_phone:customer.phone,customer_message:customer.message,
        quote_total_gross:lead.quote.totalGross,quote_snapshot:JSON.stringify(lead.quote),attribution:null,
        bitrix24_sync_status:"not_configured",bitrix24_contact_id:null,bitrix24_deal_id:null,
        bitrix24_sync_attempts:0,bitrix24_error:null,bitrix24_last_attempt_at:null,bitrix24_sync_started_at:null,
        bitrix24_synced_at:null,bitrix24_next_retry_at:null,notification_status:"disabled",notification_error:null,
        created_in_database_at:lead.receivedAt,updated_at:lead.receivedAt
      });
      assert.deepEqual(restored.quote,lead.quote);
      assert.equal(readProductConfigurationFromInquiry(restored)?.hasRgbCct,kind==="RGB-CCT");
      const quote = restored.quote;
      assert.ok(hasDetailedQuoteFinancials(quote));
      assert.ok(quote.totalGross>1);
      const sku = `MG-LED-${kind}-D300-W306`;
      const line = quote.items.find(i=>i.id===sku);
      assert.ok(line?.unitPriceNet);
      assert.equal(quote.items.filter(i=>i.category==="lighting").length,1);
      const label = kind==="POINT"?"LED punktowe":kind==="CCT"?"LED CCT":"LED RGB CCT";
      assert.equal(quote.configurationSummary.find(r=>r.label==="Oświetlenie")?.value,label);
      for (const vat of [8,23]) {
        const rows = await builder.build(restored,796,vat);
        const led = rows.find(r=>r.productId===skuIds.get(sku));
        assert.ok(led);
        assert.equal(led.price,money(line.unitPriceNet!*(1+vat/100)));
        assert.equal(led.taxIncluded,"N");
        assert.equal(led.taxRate,vat);
        assert.equal(money(rows.reduce((sum,r)=>sum+r.price*r.quantity,0)),recalculateQuoteSnapshotForVat(quote,vat)?.totalGross);
      }
      if(kind==="RGB-CCT") {
        for (const msg of [createCalculatorInquiryNotificationMessage(restored),createCalculatorInquiryCustomerMessage(restored)]) {
          assert.ok(msg.text.includes("LED RGB CCT"));
          assert.ok(msg.html.includes("LED RGB CCT"));
        }
        rgbLead=restored;
      }
      console.log(`PASS ${productType} ${kind}: transport, trusted quote, JSONB decoder, SKU, VAT 8/23`);
    }
  }
  assert.ok(rgbLead);
  const missingClient = {
    async call(method: string, payload: {filter?:{xmlId?:string}}) {
      if(method==="catalog.catalog.list") return {result:{catalogs:[{iblockId:15}]}};
      assert.equal(method,"catalog.product.list");
      const sku = payload.filter?.xmlId ?? "";
      return {result:{products:sku.startsWith("MG-LED-RGB-CCT-")?[]:[{id:10001,xmlId:sku,iblockId:15}]}};
    }
  } as unknown as Bitrix24Client;
  await assert.rejects(new Bitrix24InquiryProductRowBuilder(missingClient).build(rgbLead,796,8),/Brak istniejącego produktu RGB CCT/);
  const count=saved.size;
  for (const configuration of [
    {...DEFAULT_CONFIGURATION,length:450 as const,hasRgbCct:true},
    {...DEFAULT_CONFIGURATION,length:550 as const,hasCob:true},
    {...DEFAULT_CONFIGURATION,hasRgbCct:true,hasCob:true}
  ]) {
    const result=await submitter.submit({customer,configuration});
    assert.equal(result.success,false);
  }
  assert.equal(saved.size,count);
  assert.equal(notifications,count);
  assert.equal(syncCalls,count);
  const legacy={...DEFAULT_CONFIGURATION,hasCob:true};
  delete legacy.hasRgbCct;
  const legacyResult=await submitter.submit({customer,configuration:legacy});
  assert.equal(legacyResult.success,true);
  assert.ok(saved.get(legacyResult.inquiryId!)?.quote.items.some(i=>i.id==="MG-LED-CCT-D300-W306"));
  const pdf=await createCalculatorInquiryQuotePdf(rgbLead);
  assert.ok(pdf.bytes.length>1000);
  assert.equal(Buffer.from(pdf.bytes.subarray(0,5)).toString(),"%PDF-");
  console.log("PASS missing RGB catalog ID, invalid submissions, legacy CCT, email text/HTML, PDF generation");
  console.log("RGB INQUIRY FLOW PASS — mock HTTP, memory storage, synthetic DB row and mock Bitrix; no real network or writes.");
}
globalThis.fetch = async () => { throw Error("Network disabled in offline test"); };
main().catch(error => { console.error(error); process.exitCode=1; });
