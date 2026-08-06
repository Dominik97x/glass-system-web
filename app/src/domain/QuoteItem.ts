export type QuoteItemCategory =
  | "construction"
  | "walls"
  | "roof"
  | "zip"
  | "awning"
  | "lighting"
  | "accessory"
  | "installation";

/**
 * Księgowy podział ceny pozycji. Wartości są wyliczane po stronie serwera
 * bezpośrednio z ceny netto zapisanej w opublikowanym cenniku.
 */
export interface QuoteItemFinancials {
  priceMode: "net";
  taxIncluded: false;
  vatRate: number;
  unitPriceNet: number;
  unitTaxAmount: number;
  unitPriceGross: number;
  totalPriceNet: number;
  totalTaxAmount: number;
  totalPriceGross: number;
}

/**
 * Niezależna, szczegółowa linia finansowa zapisywana w snapshotcie.
 * Linie odpowiadają rzeczywistym produktom wysyłanym do Bitrix24, dzięki
 * czemu historyczna wycena nie zależy od przyszłych zmian cennika.
 */
export interface QuoteFinancialLineItem extends QuoteItemFinancials {
  id: string;
  name: string;
  category: QuoteItemCategory;
  quantity: number;
  websiteUnitPriceGross: number;
  websiteTotalPriceGross: number;
}

export interface QuoteItem {
  id: string;
  name: string;
  category: QuoteItemCategory;
  quantity: number;

  /** Orientacyjna cena brutto prezentowana na stronie. */
  unitPriceGross: number;
  /** Orientacyjna wartość brutto prezentowana na stronie. */
  totalPriceGross: number;

  /** Dokładne, zagregowane wartości grupy widocznej na stronie. */
  financials?: QuoteItemFinancials;
}
