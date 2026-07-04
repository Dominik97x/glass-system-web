import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import { mapInquiryToBitrix24ProductRows } from "@/integrations/bitrix24/Bitrix24ProductRowMapper";
import type { Bitrix24ProductRow } from "./Bitrix24Types";
import { readProductConfigurationFromInquiry } from "./CalculatorInquiryConfigurationReader";
import {
  Bitrix24PricingSnapshotProductRowService,
  createExampleBitrix24PricingSnapshotProductRowService,
} from "./Bitrix24PricingSnapshotProductRowService";

type Bitrix24ProductRowsSource = "quote_items" | "pricing_snapshot";

export class Bitrix24InquiryProductRowProvider {
  constructor(
    private readonly pricingSnapshotProductRowService: Bitrix24PricingSnapshotProductRowService
  ) {}

  async buildProductRows(
    inquiry: StoredCalculatorInquiryLead
  ): Promise<Bitrix24ProductRow[]> {
    const source = getBitrix24ProductRowsSource();

    if (source === "pricing_snapshot") {
      const configuration = readProductConfigurationFromInquiry(inquiry);

      if (configuration) {
        const result =
          await this.pricingSnapshotProductRowService.buildProductRows(
            configuration
          );

        return result.productRows;
      }

      console.warn(
        "BITRIX24_PRODUCT_ROWS_SOURCE=pricing_snapshot, but inquiry quote does not contain a valid ProductConfiguration. Falling back to quote items."
      );
    }

    return mapInquiryToBitrix24ProductRows(inquiry);
  }
}

export function createBitrix24InquiryProductRowProvider(): Bitrix24InquiryProductRowProvider {
  return new Bitrix24InquiryProductRowProvider(
    createExampleBitrix24PricingSnapshotProductRowService()
  );
}

function getBitrix24ProductRowsSource(): Bitrix24ProductRowsSource {
  const value = process.env.BITRIX24_PRODUCT_ROWS_SOURCE ?? "quote_items";

  if (value === "quote_items" || value === "pricing_snapshot") {
    return value;
  }

  throw new Error(`Invalid BITRIX24_PRODUCT_ROWS_SOURCE value: ${value}`);
}