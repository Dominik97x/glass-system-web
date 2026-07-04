import {
  getProductKind,
  type ProductConfiguration,
  type RoofOption,
  type WallOption,
} from "@/domain/ProductConfiguration";
import type {
  PricingSnapshotPriceField,
  PricingSnapshotPriceMatrixCriteria,
} from "./PricingSnapshotPriceReader";
import { PricingSnapshotPriceReader } from "./PricingSnapshotPriceReader";

export interface PricingSnapshotConfigurationPriceResult {
  criteria: PricingSnapshotPriceMatrixCriteria;
  fields: PricingSnapshotPriceField[];
  totalGross: number;
}

export class PricingSnapshotConfigurationPriceCalculator {
  constructor(private readonly reader: PricingSnapshotPriceReader) {}

  calculate(
    configuration: ProductConfiguration
  ): PricingSnapshotConfigurationPriceResult {
    const criteria: PricingSnapshotPriceMatrixCriteria = {
      productType: getProductKind(configuration),
      widthCm: configuration.width,
      lengthCm: configuration.length,
    };

    const fields =
      getPricingSnapshotPriceFieldsForConfiguration(configuration);

    return {
      criteria,
      fields,
      totalGross: this.reader.sumPrices(criteria, fields),
    };
  }
}

export function getPricingSnapshotPriceFieldsForConfiguration(
  configuration: ProductConfiguration
): PricingSnapshotPriceField[] {
  const fields: PricingSnapshotPriceField[] = ["constructionGross"];

  const roofField = getRoofPriceField(configuration.roof);
  fields.push(roofField);

  const wallField = getWallPriceField(configuration.walls);
  const hasWalls = wallField !== null;

  if (wallField) {
    fields.push(wallField);
  }

  if (hasWalls && configuration.hasRightZip) {
    fields.push("zipRightGross");
  }

  if (hasWalls && configuration.hasLeftZip) {
    fields.push("zipLeftGross");
  }

  if (hasWalls && configuration.hasFrontZip) {
    fields.push("zipFrontGross");
  }

  if (configuration.hasAwning) {
    fields.push("awningGross");
  }

  if (configuration.hasLed) {
    fields.push("ledSpotGross");
  }

  if (configuration.hasCob) {
    fields.push("ledCobGross");
  }

  if (configuration.hasHandles) {
    fields.push("handlesGross");
  }

  if (configuration.hasBrushes) {
    fields.push("brushesGross");
  }

  if (configuration.hasLevelingProfile) {
    fields.push("levelingProfileGross");
  }

  return fields;
}

function getWallPriceField(
  wallOption: WallOption
): PricingSnapshotPriceField | null {
  if (wallOption === "none") {
    return null;
  }

  if (wallOption === "glass_clear") {
    return "wallGlassClearGross";
  }

  if (wallOption === "glass_milky") {
    return "wallGlassMilkyGross";
  }

  return "wallGlassTintedGross";
}

function getRoofPriceField(
  roofOption: RoofOption
): PricingSnapshotPriceField {
  if (roofOption === "polycarbonate_clear") {
    return "roofPolycarbonateClearGross";
  }

  if (roofOption === "polycarbonate_milky") {
    return "roofPolycarbonateMilkyGross";
  }

  if (roofOption === "polycarbonate_grey") {
    return "roofPolycarbonateGreyGross";
  }

  if (roofOption === "polycarbonate_smoke") {
    return "roofPolycarbonateSmokeGross";
  }

  if (roofOption === "glass_clear") {
    return "roofGlassClearGross";
  }

  return "roofGlassMilkyGross";
}