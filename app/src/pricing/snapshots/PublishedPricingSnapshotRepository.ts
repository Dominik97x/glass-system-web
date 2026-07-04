import examplePricingSnapshot from "@/data/pricing/eg/published-pricing.example.json";
import type { PricingSnapshot } from "./PricingSnapshot";
import {
  validatePricingSnapshot,
  type PricingSnapshotValidationIssue,
} from "./PricingSnapshotValidator";

export interface PublishedPricingSnapshotRepository {
  getPublishedSnapshot(): Promise<PricingSnapshot>;
}

export class InvalidPublishedPricingSnapshotError extends Error {
  constructor(
    message: string,
    public readonly issues: PricingSnapshotValidationIssue[]
  ) {
    super(message);
    this.name = "InvalidPublishedPricingSnapshotError";
  }
}

export class StaticPublishedPricingSnapshotRepository
  implements PublishedPricingSnapshotRepository
{
  constructor(private readonly snapshot: PricingSnapshot) {}

  async getPublishedSnapshot(): Promise<PricingSnapshot> {
    const validation = validatePricingSnapshot(this.snapshot);

    if (!validation.success) {
      throw new InvalidPublishedPricingSnapshotError(
        "Published pricing snapshot is invalid.",
        validation.errors
      );
    }

    return this.snapshot;
  }
}

export function createExamplePublishedPricingSnapshotRepository(): PublishedPricingSnapshotRepository {
  return new StaticPublishedPricingSnapshotRepository(
    examplePricingSnapshot as PricingSnapshot
  );
}
