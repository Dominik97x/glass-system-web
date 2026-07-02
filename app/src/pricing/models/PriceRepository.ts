import type { ProductConfiguration } from "@/domain/ProductConfiguration";

export interface PriceRepository {
  getConstructionPrice(configuration: ProductConfiguration): number;
  getWallPrice(configuration: ProductConfiguration): number;
  getRoofPrice(configuration: ProductConfiguration): number;
  getSideZipPrice(configuration: ProductConfiguration): number;
  getFrontZipPrice(configuration: ProductConfiguration): number;
  getAwningPrice(configuration: ProductConfiguration): number;
  getPointLedPrice(configuration: ProductConfiguration): number;
  getCobLedPrice(configuration: ProductConfiguration): number;
  getLevelingProfilePrice(configuration: ProductConfiguration): number;
  getHandlesPrice(configuration: ProductConfiguration): number;
  getBrushesPrice(configuration: ProductConfiguration): number;
}