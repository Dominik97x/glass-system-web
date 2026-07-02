import type { ProductConfiguration } from "./ProductConfiguration";
import type { QuoteItem } from "./QuoteItem";

export interface Quote {
  configuration: ProductConfiguration;
  items: QuoteItem[];
  totalGross: number;
  currency: "PLN";
}