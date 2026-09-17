import type { ProductConfiguration } from "./ProductConfiguration";
import type { QuoteFinancialLineItem, QuoteItem } from "./QuoteItem";

/**
 * Dokładne podsumowanie księgowe wyceny.
 * `Quote.totalGross` ma pozostawać zgodne z `QuoteFinancials.totalGross`, aby
 * klient, zapis zapytania i Bitrix24 widziały tę samą kwotę brutto.
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

  /** Suma brutto prezentowana klientowi na stronie; zgodna z finansami wyceny. */
  totalGross: number;

  /** Dokładne wartości netto / VAT / brutto do zapisu w snapshotcie. */
  financials?: QuoteFinancials;

  currency: "PLN";
}
