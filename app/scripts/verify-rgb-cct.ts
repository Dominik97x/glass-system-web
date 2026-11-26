import assert from "node:assert/strict";
import { DEFAULT_CONFIGURATION, type ProductConfiguration, type Length, type Width } from "../src/domain/ProductConfiguration";
import { clearUnavailableLighting, getLightingSelectionError, selectLighting, isLightingAvailable } from "../src/domain/LightingPolicy";
import { QuoteService } from "../src/pricing/services/QuoteService";
import { getCrmCoreProduct } from "../src/pricing/catalog/CrmCoreCatalog";
import { validateCalculatorInquirySubmission } from "../src/inquiries/validators/calculator-inquiry-validator";
import { PricingSnapshotPriceReader } from "../src/pricing/snapshots/PricingSnapshotPriceReader";
import snapshot from "../src/data/pricing/glass-system/published-pricing.generated.json";
import type { PricingSnapshot } from "../src/pricing/snapshots/PricingSnapshot";
import { roundMoney } from "../src/pricing/snapshots/PricingSnapshotTaxCalculator";
const service = new QuoteService();
const reader = new PricingSnapshotPriceReader(snapshot as PricingSnapshot);
const widths: Width[] = [306,406,506,606,706,806,906,1006,1106,1206];
const lengths: Length[] = [300,350,400,450,500,550,600];
const customer = {name:"Test",email:"test@example.com",phone:"500000000",message:""};
const validate = (configuration: unknown) => validateCalculatorInquirySubmission({customer,configuration});
let accepted=0, rejected=0;
for (const productType of ["terrace_roof", "winter_garden"] as const) {
  for (const width of widths) for (const length of lengths) {
    const base: ProductConfiguration = {...DEFAULT_CONFIGURATION, productType, width,length, walls: productType === "winter_garden" ? "glass_clear" : "none", hasLevelingProfile: productType === "winter_garden"};
    const noLight=service.createQuote(base);
    for (const kind of ["point","cct","rgb_cct"] as const) {
      const config={...base,hasLed:kind==="point",hasCob:kind==="cct",hasRgbCct:kind==="rgb_cct"};
      const expected = kind==="point" || (kind==="cct" ? length<=500 : length<=400);
      assert.equal(isLightingAvailable(kind,length,width),expected);
      const row = (snapshot as PricingSnapshot).priceMatrix.find(r=>r.productType===productType && r.widthCm===width && r.lengthCm===length);
      assert.equal(row?.availability?.ledAutoQuote?.[kind],expected,`Snapshot policy ${productType} ${length}x${width} ${kind}`);
      const validated=validate(config);
      assert.equal(validated.success,expected);
      if (!expected) {
        assert.throws(()=>service.createQuote(config), /wymaga wyceny indywidualnej/);
        rejected++; continue;
      }
      if (!validated.success) throw Error(validated.message);
      const quote=service.createQuote(validated.submission.configuration);
      const lines=quote.financials!.items.filter(i=>i.category==="lighting");
      assert.equal(lines.length,1);
      const part=kind==="point"?"POINT":kind==="cct"?"CCT":"RGB-CCT";
      assert.equal(lines[0].id,`MG-LED-${part}-D${length}-W${width}`);
      const criteria={productType,widthCm:width,lengthCm:length};
      const expectedNet=kind==="rgb_cct"?getCrmCoreProduct("led_rgb_cct",length,width).priceNet:reader.getPrice(criteria,kind==="point"?"ledSpotNet":"ledStripNet");
      assert.equal(lines[0].totalPriceNet,expectedNet);
      assert.equal(roundMoney(quote.financials!.totalNet-noLight.financials!.totalNet),expectedNet);
      assert.equal(roundMoney(quote.totalGross-noLight.totalGross),roundMoney(expectedNet*(1+quote.financials!.defaultVatRate/100)));
      accepted++;
    }
  }
}
assert.equal(accepted,300); assert.equal(rejected,120);
const legacy={...DEFAULT_CONFIGURATION,hasCob:true}; delete legacy.hasRgbCct;
assert.equal(validate(legacy).success,true);
assert.equal(service.createQuote(legacy).financials!.items.find(i=>i.category==="lighting")?.id,"MG-LED-CCT-D300-W306");
assert.equal(validate({...legacy,hasRgbCct:true}).success,false);
assert.equal(validate({...legacy,hasRgbCct:"true"}).success,false);
assert.equal(validate({...legacy,hasLed:true}).success,false);
assert.throws(()=>service.createQuote({...legacy,hasRgbCct:true}),/jednocześnie/);
const rgb=selectLighting(legacy,"rgb_cct",true);
assert.equal(rgb.hasRgbCct,true); assert.equal(rgb.hasCob,false); assert.equal(rgb.hasLed,false);
assert.equal(clearUnavailableLighting({...rgb,length:450}).hasRgbCct,false);
assert.equal(clearUnavailableLighting({...legacy,length:550}).hasCob,false);
assert.equal(getLightingSelectionError(rgb),null);
assert.equal(selectLighting({...DEFAULT_CONFIGURATION,length:450},"rgb_cct",true).hasRgbCct,false);
console.log(`PASS ${accepted} automatic LED quotes; ${rejected} individual-quote rejections; legacy and UI transitions. Offline only.`);
