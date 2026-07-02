import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { PriceRepository } from "../models/PriceRepository";

export class RoofCalculator {
  constructor(private repository: PriceRepository) {}

  calculate(configuration: ProductConfiguration): number {
    return this.repository.getRoofPrice(configuration);
  }
}