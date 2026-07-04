import {
  createExamplePublishedPricingSnapshotRepository,
  InvalidPublishedPricingSnapshotError,
} from "@/pricing/snapshots/PublishedPricingSnapshotRepository";
import { validatePricingSnapshot } from "@/pricing/snapshots/PricingSnapshotValidator";

export const runtime = "nodejs";

const repository = createExamplePublishedPricingSnapshotRepository();

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