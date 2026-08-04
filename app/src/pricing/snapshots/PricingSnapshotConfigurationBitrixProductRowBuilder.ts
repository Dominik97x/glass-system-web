import {
  getProductKind,
  type ProductConfiguration,
  type RoofOption,
  type WallOption,
} from "@/domain/ProductConfiguration";
import {
  type PricingSnapshotBitrixProductMappingCriteria,
  type PricingSnapshotPreparedBitrixProductRow,
  PricingSnapshotBitrixProductMapper,
} from "./PricingSnapshotBitrixProductMapper";
import {
  type PricingSnapshotPriceField,
  type PricingSnapshotPriceMatrixCriteria,
  PricingSnapshotPriceReader,
} from "./PricingSnapshotPriceReader";
import { roundMoney } from "./PricingSnapshotTaxCalculator";

export interface PricingSnapshotConfigurationBitrixProductRowsResult {
  criteria: PricingSnapshotPriceMatrixCriteria;
  rows: PricingSnapshotPreparedBitrixProductRow[];
  totalGross: number;
  totalNet: number;
  totalTax: number;
}

export class PricingSnapshotConfigurationBitrixProductRowBuilder {
  constructor(
    private readonly reader: PricingSnapshotPriceReader,
    private readonly mapper: PricingSnapshotBitrixProductMapper
  ) {}

  build(
    configuration: ProductConfiguration
  ): PricingSnapshotConfigurationBitrixProductRowsResult {
    const criteria: PricingSnapshotPriceMatrixCriteria = {
      productType: getProductKind(configuration),
      widthCm: configuration.width,
      lengthCm: configuration.length,
    };

    const priceMatrixRow = this.reader.getActivePriceMatrixRow(criteria);
    const rows: PricingSnapshotPreparedBitrixProductRow[] = [];
    let sort = 1;

    const addRow = (
      mappingCriteria: Omit<
        PricingSnapshotBitrixProductMappingCriteria,
        "productType" | "widthCm" | "lengthCm"
      >,
      sourcePrice: number
    ): void => {
      if (sourcePrice <= 0) {
        return;
      }

      rows.push(
        this.mapper.prepareProductRow(
          {
            ...mappingCriteria,
            productType: criteria.productType,
            widthCm: criteria.widthCm,
            lengthCm: criteria.lengthCm,
          },
          sourcePrice,
          1,
          sort
        )
      );

      sort += 1;
    };

    addRow(
      {
        quoteItemCategory: "construction",
        quoteItemKey: "construction",
        optionCode: "default",
      },
      priceMatrixRow.constructionGross
    );

    const roofField = getRoofPriceField(configuration.roof);

    addRow(
      {
        quoteItemCategory: "roof",
        quoteItemKey: getRoofQuoteItemKey(configuration.roof),
        optionCode: configuration.roof,
      },
      priceMatrixRow[roofField]
    );

    const wallOption = configuration.walls;
    const wallField = getWallPriceField(wallOption);

    if (wallField && wallOption !== "none") {
      addRow(
        {
          quoteItemCategory: "walls",
          quoteItemKey: getWallQuoteItemKey(wallOption),
          optionCode: wallOption,
        },
        priceMatrixRow[wallField]
      );
    }

    if (configuration.walls !== "none" && configuration.hasRightZip) {
      addRow(
        {
          quoteItemCategory: "zip",
          quoteItemKey: "zip_right",
          optionCode: "right",
        },
        priceMatrixRow.zipRightGross
      );
    }

    if (configuration.walls !== "none" && configuration.hasLeftZip) {
      addRow(
        {
          quoteItemCategory: "zip",
          quoteItemKey: "zip_left",
          optionCode: "left",
        },
        priceMatrixRow.zipLeftGross
      );
    }

    if (configuration.walls !== "none" && configuration.hasFrontZip) {
      addRow(
        {
          quoteItemCategory: "zip",
          quoteItemKey: "zip_front",
          optionCode: "front",
        },
        priceMatrixRow.zipFrontGross
      );
    }

    if (configuration.hasAwning) {
      addRow(
        {
          quoteItemCategory: "awning",
          quoteItemKey: "awning",
          optionCode: "default",
        },
        priceMatrixRow.awningGross
      );
    }

    if (configuration.hasLed) {
      addRow(
        {
          quoteItemCategory: "lighting",
          quoteItemKey: "led_spot",
          optionCode: "spot",
        },
        priceMatrixRow.ledSpotGross
      );
    }

    if (configuration.hasCob) {
      addRow(
        {
          quoteItemCategory: "lighting",
          quoteItemKey: "led_cct",
          optionCode: "cct",
        },
        priceMatrixRow.ledStripGross
      );
    }

    if (configuration.hasHandles) {
      addRow(
        {
          quoteItemCategory: "accessory",
          quoteItemKey: "handles",
          optionCode: "handles",
        },
        priceMatrixRow.handlesGross
      );
    }

    if (configuration.hasBrushes) {
      addRow(
        {
          quoteItemCategory: "accessory",
          quoteItemKey: "brushes",
          optionCode: "brushes",
        },
        priceMatrixRow.brushesGross
      );
    }

    if (configuration.hasLevelingProfile) {
      addRow(
        {
          quoteItemCategory: "accessory",
          quoteItemKey: "leveling_profile",
          optionCode: "leveling_profile",
        },
        priceMatrixRow.levelingProfileGross
      );
    }

    return {
      criteria,
      rows,
      totalGross: roundMoney(
        rows.reduce((sum, row) => sum + row.priceGross, 0)
      ),
      totalNet: roundMoney(rows.reduce((sum, row) => sum + row.priceNet, 0)),
      totalTax: roundMoney(rows.reduce((sum, row) => sum + row.taxAmount, 0)),
    };
  }
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

function getWallQuoteItemKey(wallOption: Exclude<WallOption, "none">): string {
  if (wallOption === "glass_clear") {
    return "walls_glass_clear";
  }

  if (wallOption === "glass_milky") {
    return "walls_glass_milky";
  }

  return "walls_glass_tinted";
}

function getRoofPriceField(roofOption: RoofOption): PricingSnapshotPriceField {
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

  if (roofOption === "glass_milky") {
    return "roofGlassMilkyGross";
  }

  return "roofGlassTintedGross";
}

function getRoofQuoteItemKey(roofOption: RoofOption): string {
  return `roof_${roofOption}`;
}