import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { PriceRepository } from "../models/PriceRepository";

export class ZipCalculator {
  constructor(private repository: PriceRepository) {}

  calculate(configuration: ProductConfiguration): number {
    if (configuration.walls === "none") {
      return 0;
    }

    const sideZipPrice = this.repository.getSideZipPrice(configuration);
    const frontZipPrice = this.repository.getFrontZipPrice(configuration);

    let total = 0;

    if (configuration.hasLeftZip) {
      total += sideZipPrice;
    }

    if (configuration.hasRightZip) {
      total += sideZipPrice;
    }

    if (configuration.hasFrontZip) {
      total += frontZipPrice;
    }

    return total;
  }
}