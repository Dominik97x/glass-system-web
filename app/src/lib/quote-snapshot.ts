import type { Quote } from "@/domain/Quote";
import type { QuoteItem } from "@/domain/QuoteItem";
import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import {
  getConfigurationSummaryRows,
  type ConfigurationSummaryRow,
} from "@/lib/configuration-summary";

export interface QuoteSnapshotItem {
  id: string;
  name: string;
  category: QuoteItem["category"];
  quantity: number;
  unitPriceGross: number;
  totalPriceGross: number;
}

export interface QuoteSnapshot {
  configuration: ProductConfiguration;
  configurationSummary: ConfigurationSummaryRow[];
  items: QuoteSnapshotItem[];
  totalGross: number;
  currency: Quote["currency"];
}

function mapQuoteItemToSnapshotItem(item: QuoteItem): QuoteSnapshotItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unitPriceGross: item.unitPriceGross,
    totalPriceGross: item.totalPriceGross,
  };
}

export function createQuoteSnapshot(quote: Quote): QuoteSnapshot {
  return {
    configuration: quote.configuration,
    configurationSummary: getConfigurationSummaryRows(quote.configuration),
    items: quote.items.map(mapQuoteItemToSnapshotItem),
    totalGross: quote.totalGross,
    currency: quote.currency,
  };
}