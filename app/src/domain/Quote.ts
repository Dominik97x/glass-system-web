import type { ProductConfiguration } from "./ProductConfiguration";
import type { QuoteItem } from "./QuoteItem";

export interface Quote {
  id: string;
  configuration: ProductConfiguration;
  items: QuoteItem[];
  totalGross: number;
  currency: "PLN";
}