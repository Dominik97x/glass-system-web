import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import {
  createExamplePublishedPricingSnapshotRepository,
  type PublishedPricingSnapshotRepository,
} from "@/pricing/snapshots/PublishedPricingSnapshotRepository";
import { PricingSnapshotBitrixProductMapper } from "@/pricing/snapshots/PricingSnapshotBitrixProductMapper";
import {
  type PricingSnapshotPreparedBitrixProductRow,
} from "@/pricing/snapshots/PricingSnapshotBitrixProductMapper";
import { PricingSnapshotConfigurationBitrixProductRowBuilder } from "@/pricing/snapshots/PricingSnapshotConfigurationBitrixProductRowBuilder";
import { PricingSnapshotPriceReader } from "@/pricing/snapshots/PricingSnapshotPriceReader";
import type { Bitrix24ProductRow } from "./Bitrix24Types";
import { mapPreparedRowsToBitrix24ProductRows } from "./Bitrix24PreparedProductRowMapper";

export interface Bitrix24PricingSnapshotProductRowsResult {
  preparedRows: PricingSnapshotPreparedBitrixProductRow[];
  productRows: Bitrix24ProductRow[];
  totalGross: number;
  totalNet: number;
  totalTax: number;
}

export class Bitrix24PricingSnapshotProductRowService {
  constructor(
    private readonly snapshotRepository: PublishedPricingSnapshotRepository
  ) {}

  async buildProductRows(
    configuration: ProductConfiguration
  ): Promise<Bitrix24PricingSnapshotProductRowsResult> {
    const snapshot = await this.snapshotRepository.getPublishedSnapshot();
    const reader = new PricingSnapshotPriceReader(snapshot);
    const productMapper = new PricingSnapshotBitrixProductMapper(snapshot);
    const productRowBuilder =
      new PricingSnapshotConfigurationBitrixProductRowBuilder(
        reader,
        productMapper
      );

    const preparedRows = productRowBuilder.build(configuration);
    const productRows = mapPreparedRowsToBitrix24ProductRows(
      preparedRows.rows
    );

    return {
      preparedRows: preparedRows.rows,
      productRows,
      totalGross: preparedRows.totalGross,
      totalNet: preparedRows.totalNet,
      totalTax: preparedRows.totalTax,
    };
  }
}

export function createExampleBitrix24PricingSnapshotProductRowService(): Bitrix24PricingSnapshotProductRowService {
  return new Bitrix24PricingSnapshotProductRowService(
    createExamplePublishedPricingSnapshotRepository()
  );
}