import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import { createExampleBitrix24PricingSnapshotProductRowService } from "@/integrations/bitrix24/Bitrix24PricingSnapshotProductRowService";
import {
  createExamplePublishedPricingSnapshotRepository,
  InvalidPublishedPricingSnapshotError,
} from "@/pricing/snapshots/PublishedPricingSnapshotRepository";
import { PricingSnapshotConfigurationPriceCalculator } from "@/pricing/snapshots/PricingSnapshotConfigurationPriceCalculator";
import { PricingSnapshotPriceReader } from "@/pricing/snapshots/PricingSnapshotPriceReader";
import { calculateTaxForPrice } from "@/pricing/snapshots/PricingSnapshotTaxCalculator";
import { validatePricingSnapshot } from "@/pricing/snapshots/PricingSnapshotValidator";

export const runtime = "nodejs";

const repository = createExamplePublishedPricingSnapshotRepository();
const bitrixProductRowService =
  createExampleBitrix24PricingSnapshotProductRowService();

const winterGardenConfiguration: ProductConfiguration = {
  width: 306,
  length: 300,
  walls: "glass_clear",
  roof: "polycarbonate_clear",
  hasFrontZip: true,
  hasLeftZip: false,
  hasRightZip: false,
  hasAwning: true,
  hasLed: true,
  hasCob: false,
  hasHandles: true,
  hasBrushes: true,
  hasLevelingProfile: true,
};

const terraceRoofConfiguration: ProductConfiguration = {
  width: 306,
  length: 300,
  walls: "none",
  roof: "polycarbonate_clear",
  hasFrontZip: false,
  hasLeftZip: false,
  hasRightZip: false,
  hasAwning: true,
  hasLed: true,
  hasCob: false,
  hasHandles: true,
  hasBrushes: true,
  hasLevelingProfile: true,
};

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      {
        success: false,
        message: "Ten endpoint jest dostępny tylko w trybie developerskim.",
      },
      { status: 404 }
    );
  }

  try {
    const snapshot = await repository.getPublishedSnapshot();
    const validation = validatePricingSnapshot(snapshot);

    const reader = new PricingSnapshotPriceReader(snapshot);
    const configurationCalculator =
      new PricingSnapshotConfigurationPriceCalculator(reader);

    const winterGardenResult = configurationCalculator.calculate(
      winterGardenConfiguration
    );

    const terraceRoofResult = configurationCalculator.calculate(
      terraceRoofConfiguration
    );

    const constructionVatRule = reader.getActiveVatRule("construction");

    const winterGardenTaxCalculation = calculateTaxForPrice(
      winterGardenResult.totalGross,
      constructionVatRule
    );

    const terraceRoofTaxCalculation = calculateTaxForPrice(
      terraceRoofResult.totalGross,
      constructionVatRule
    );

    const winterGardenBitrixRows =
      await bitrixProductRowService.buildProductRows(
        winterGardenConfiguration
      );

    return Response.json({
      success: validation.success,
      summary: {
        pricingVersion: snapshot.metadata.pricingVersion,
        currency: snapshot.metadata.currency,
        productTypes: snapshot.productTypes.length,
        dimensions: snapshot.dimensions.length,
        priceMatrixRows: snapshot.priceMatrix.length,
        vatRules: snapshot.vatRules.length,
        bitrixProductMappings: snapshot.bitrixProductMappings.length,
        errors: validation.errors.length,
        warnings: validation.warnings.length,
      },
      readerChecks: {
        activeDimensionKeys: reader.getActiveDimensionKeys(),
      },
      configurationChecks: {
        winterGarden300x306WithOptions: {
          criteria: winterGardenResult.criteria,
          fields: winterGardenResult.fields,
          totalGross: winterGardenResult.totalGross,
          expectedTotalGross: 35419,
          passed: winterGardenResult.totalGross === 35419,
        },
        terraceRoof300x306WithOptions: {
          criteria: terraceRoofResult.criteria,
          fields: terraceRoofResult.fields,
          totalGross: terraceRoofResult.totalGross,
          expectedTotalGross: 17311,
          passed: terraceRoofResult.totalGross === 17311,
        },
      },
      taxChecks: {
        winterGarden300x306WithOptions: winterGardenTaxCalculation,
        terraceRoof300x306WithOptions: terraceRoofTaxCalculation,
      },
      bitrixProductMappingChecks: {
        preparedRows: winterGardenBitrixRows.preparedRows.map((row) => ({
          productId: row.productId,
          productName: row.productName,
          priceNet: row.priceNet,
          priceGross: row.priceGross,
          taxAmount: row.taxAmount,
          vatRate: row.vatRate,
          taxIncluded: row.taxIncluded,
          quantity: row.quantity,
          sort: row.sort,
          sourcePrice: row.sourcePrice,
          sourceTaxIncluded: row.sourceTaxIncluded,
        })),
        totalGross: winterGardenBitrixRows.totalGross,
        totalNet: winterGardenBitrixRows.totalNet,
        totalTax: winterGardenBitrixRows.totalTax,
        expectedTotalGross: 35419,
        passed: winterGardenBitrixRows.totalGross === 35419,
      },
      bitrix24ProductRowChecks: {
        rows: winterGardenBitrixRows.productRows,
        totalNet: winterGardenBitrixRows.productRows.reduce(
          (sum, row) => sum + row.price * row.quantity,
          0
        ),
        expectedTaxIncluded: "N",
      },
      validation,
    });
  } catch (error) {
    if (error instanceof InvalidPublishedPricingSnapshotError) {
      return Response.json(
        {
          success: false,
          message: error.message,
          errors: error.issues,
        },
        { status: 500 }
      );
    }

    throw error;
  }
}