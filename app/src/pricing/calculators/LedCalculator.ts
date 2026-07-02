import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { PriceRepository } from "../models/PriceRepository";

export class LedCalculator {
  constructor(private repository: PriceRepository) {}

  calculate(configuration: ProductConfiguration): number {
    let total = 0;

    if (configuration.hasLed) {
      total += this.repository.getPointLedPrice(configuration);
    }

    if (configuration.hasCob) {
      total += this.repository.getCobLedPrice(configuration);
    }

    return total;
  }
}