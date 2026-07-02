import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { PriceRepository } from "../models/PriceRepository";

export class AccessoriesCalculator {
  constructor(private repository: PriceRepository) {}

  calculate(configuration: ProductConfiguration): number {
    let total = 0;

    if (configuration.hasLevelingProfile) {
      total += this.repository.getLevelingProfilePrice(configuration);
    }

    if (configuration.hasHandles) {
      total += this.repository.getHandlesPrice(configuration);
    }

    if (configuration.hasBrushes) {
      total += this.repository.getBrushesPrice(configuration);
    }

    return total;
  }
}