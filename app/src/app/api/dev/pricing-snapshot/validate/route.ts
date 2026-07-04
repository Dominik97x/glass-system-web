import examplePricingSnapshot from "@/data/pricing/eg/published-pricing.example.json";
import type { PricingSnapshot } from "@/pricing/snapshots/PricingSnapshot";
import { validatePricingSnapshot } from "@/pricing/snapshots/PricingSnapshotValidator";

export const runtime = "nodejs";

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

  const snapshot = examplePricingSnapshot as PricingSnapshot;
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
}