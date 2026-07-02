import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { Quote } from "@/domain/Quote";
import { PricingEngine } from "../engine/PricingEngine";

export class QuoteService {
  private pricingEngine = new PricingEngine();

  createQuote(configuration: ProductConfiguration): Quote {
    return this.pricingEngine.calculate(configuration);
  }
}