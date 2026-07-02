import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { PriceRepository } from "../models/PriceRepository";

export class AwningCalculator {
  constructor(private repository: PriceRepository) {}

  calculate(configuration: ProductConfiguration): number {
    if (!configuration.hasAwning) {
      return 0;
    }

    return this.repository.getAwningPrice(configuration);
  }
}