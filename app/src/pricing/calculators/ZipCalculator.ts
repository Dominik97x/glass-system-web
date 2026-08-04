import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { PriceRepository } from "../models/PriceRepository";

export class ZipCalculator {
  constructor(private repository: PriceRepository) {}

  calculate(configuration: ProductConfiguration): number {
    if (
      configuration.walls === "none" &&
      (configuration.hasLeftZip || configuration.hasRightZip)
    ) {
      throw new Error("Boczne rolety ZIP wymagają wybrania ścian.");
    }

    let total = 0;

    if (configuration.hasFrontZip) {
      total += this.repository.getFrontZipPrice(configuration);
    }

    if (configuration.walls !== "none") {
      const sideZipPrice = this.repository.getSideZipPrice(configuration);

      if (configuration.hasLeftZip) {
        total += sideZipPrice;
      }

      if (configuration.hasRightZip) {
        total += sideZipPrice;
      }
    }

    return total;
  }
}