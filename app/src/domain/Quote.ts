import type { ProductConfiguration } from "./ProductConfiguration";
import type { QuoteFinancialLineItem, QuoteItem } from "./QuoteItem";

/**
 * Dokładne podsumowanie księgowe wyceny.
 * `Quote.totalGross` pozostaje orientacyjną sumą brutto prezentowaną na stronie.
 */
export interface QuoteFinancials {
  priceMode: "net";
  taxIncluded: false;
  defaultVatRate: number;
  items: QuoteFinancialLineItem[];
  totalNet: number;
  totalTaxAmount: number;
  totalGross: number;
}

export interface Quote {
  configuration: ProductConfiguration;
  items: QuoteItem[];

  /** Orientacyjna suma brutto prezentowana klientowi na stronie. */
  totalGross: number;

  /** Dokładne wartości netto / VAT / brutto do zapisu w snapshotcie. */
  financials?: QuoteFinancials;

  currency: "PLN";
}
