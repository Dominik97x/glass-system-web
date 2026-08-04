import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { PriceRepository } from "../models/PriceRepository";
import { EG_CONSTRUCTION_PRICES } from "@/data/pricing/eg/construction";
import { EG_ROOF_PRICES } from "@/data/pricing/eg/roof";
import { EG_ZIP_PRICES } from "@/data/pricing/eg/zip";
import { EG_WALL_PRICES } from "@/data/pricing/eg/walls";
import { EG_AWNING_PRICES } from "@/data/pricing/eg/awning";
import { EG_LED_PRICES } from "@/data/pricing/eg/led";
import { EG_ACCESSORIES_PRICES } from "@/data/pricing/eg/accessories";

export class FilePriceRepository implements PriceRepository {
  getConstructionPrice(configuration: ProductConfiguration): number {
    const row = EG_CONSTRUCTION_PRICES.find(
      (item) =>
        item.width === configuration.width &&
        item.length === configuration.length
    );

    if (!row) {
      throw new Error("Construction price not found");
    }

    return row.priceGross;
  }

getWallPrice(configuration: ProductConfiguration): number {
  if (configuration.walls === "none") {
    return 0;
  }

  const row = EG_WALL_PRICES.find(
    (item) =>
      item.width === configuration.width &&
      item.length === configuration.length
  );

  if (!row) {
    throw new Error("Wall price not found");
  }

  switch (configuration.walls) {
    case "glass_clear":
      return row.glassClearPriceGross;

    case "glass_milky":
      return row.glassMilkyPriceGross;

    case "glass_tinted":
      return row.glassTintedPriceGross;
  }
}

  getRoofPrice(configuration: ProductConfiguration): number {
    const row = EG_ROOF_PRICES.find(
      (item) =>
        item.width === configuration.width &&
        item.length === configuration.length
    );

    if (!row) {
      throw new Error("Roof price not found");
    }

    switch (configuration.roof) {
      case "polycarbonate_clear":
        return row.polycarbonateClear;
      case "polycarbonate_milky":
        return row.polycarbonateMilky;
      case "polycarbonate_grey":
        return row.polycarbonateGrey;
      case "polycarbonate_smoke":
        return row.polycarbonateSmoke;
      case "glass_clear":
        return row.glassClear;
      case "glass_milky":
        return row.glassMilky;
      case "glass_tinted":
        throw new Error(
          "Tinted glass roof is not supported by the legacy TypeScript price tables."
        );
    }
  }
private getZipRow(configuration: ProductConfiguration) {
  const row = EG_ZIP_PRICES.find(
    (item) =>
      item.width === configuration.width &&
      item.length === configuration.length
  );

  if (!row) {
    throw new Error("ZIP price not found");
  }

  return row;
}

getSideZipPrice(configuration: ProductConfiguration): number {
  return this.getZipRow(configuration).sideZipPriceGross;
}

getFrontZipPrice(configuration: ProductConfiguration): number {
  return this.getZipRow(configuration).frontZipPriceGross;
}
getAwningPrice(configuration: ProductConfiguration): number {
  const row = EG_AWNING_PRICES.find(
    (item) =>
      item.width === configuration.width &&
      item.length === configuration.length
  );

  if (!row) {
    throw new Error("Awning price not found");
  }

  return row.priceGross;
}
private getLedRow(configuration: ProductConfiguration) {
  const row = EG_LED_PRICES.find(
    (item) =>
      item.width === configuration.width &&
      item.length === configuration.length
  );

  if (!row) {
    throw new Error("LED price not found");
  }

  return row;
}

getPointLedPrice(configuration: ProductConfiguration): number {
  return this.getLedRow(configuration).pointLedPriceGross;
}

getCobLedPrice(configuration: ProductConfiguration): number {
  return this.getLedRow(configuration).stripLedPriceGross;
}
private getAccessoriesRow(configuration: ProductConfiguration) {
  const row = EG_ACCESSORIES_PRICES.find(
    (item) =>
      item.width === configuration.width &&
      item.length === configuration.length
  );

  if (!row) {
    throw new Error("Accessories price not found");
  }

  return row;
}

getLevelingProfilePrice(configuration: ProductConfiguration): number {
  return this.getAccessoriesRow(configuration).levelingProfilePriceGross;
}

getHandlesPrice(configuration: ProductConfiguration): number {
  return this.getAccessoriesRow(configuration).handlesPriceGross;
}

getBrushesPrice(configuration: ProductConfiguration): number {
  return this.getAccessoriesRow(configuration).brushesPriceGross;
}
}