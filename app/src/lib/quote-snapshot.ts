import type { Quote } from "@/domain/Quote";
import type {
  QuoteFinancialLineItem,
  QuoteItem,
} from "@/domain/QuoteItem";
import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import {
  getConfigurationSummaryRows,
  type ConfigurationSummaryRow,
} from "@/lib/configuration-summary";

export const CURRENT_QUOTE_SNAPSHOT_VERSION = 2 as const;

export interface QuoteSnapshotItem {
  id: string;
  name: string;
  category: QuoteItem["category"];
  quantity: number;

  /** Dokładna cena księgowa brutto w snapshotach v2. */
  unitPriceGross: number;
  /** Dokładna wartość księgowa brutto w snapshotach v2. */
  totalPriceGross: number;

  unitPriceNet?: number;
  unitTaxAmount?: number;
  totalPriceNet?: number;
  totalTaxAmount?: number;
  vatRate?: number;
  taxIncluded?: false;
  priceMode?: "net";

  /** Orientacyjne pełne złote pokazywane na stronie. */
  websiteUnitPriceGross?: number;
  /** Orientacyjne pełne złote pokazywane na stronie. */
  websiteTotalPriceGross?: number;
}


export interface RecalculatedQuoteFinancialLineItem {
  id: string;
  name: string;
  quantity: number;
  totalPriceNet: number;
  totalTaxAmount: number;
  totalPriceGross: number;
}

export interface RecalculatedQuoteFinancials {
  vatRate: number;
  totalNet: number;
  totalTaxAmount: number;
  totalGross: number;
  items: RecalculatedQuoteFinancialLineItem[];
}

export interface QuoteSnapshotWebsiteItem {
  id: string;
  name: string;
  category: QuoteItem["category"];
  quantity: number;
  unitPriceGross: number;
  totalPriceGross: number;
}

export interface QuoteSnapshot {
  version?: 1 | typeof CURRENT_QUOTE_SNAPSHOT_VERSION;
  priceMode?: "gross" | "net";
  defaultVatRate?: number;
  taxIncluded?: boolean;

  configuration: ProductConfiguration;
  configurationSummary: ConfigurationSummaryRow[];

  /** Szczegółowe pozycje księgowe dla v2; starsze snapshoty mają tu pozycje strony. */
  items: QuoteSnapshotItem[];

  /** Zagregowane pozycje dokładnie takie, jak widział je klient na stronie. */
  websiteItems?: QuoteSnapshotWebsiteItem[];

  /** Dokładne podsumowanie księgowe dla snapshotów v2. */
  totalNet?: number;
  totalTaxAmount?: number;
  totalGross: number;

  /** Orientacyjna suma brutto prezentowana klientowi na stronie. */
  websiteTotalGross?: number;

  currency: Quote["currency"];
}

function mapWebsiteQuoteItem(item: QuoteItem): QuoteSnapshotWebsiteItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unitPriceGross: item.unitPriceGross,
    totalPriceGross: item.totalPriceGross,
  };
}

function mapLegacyQuoteItem(item: QuoteItem): QuoteSnapshotItem {
  return {
    ...mapWebsiteQuoteItem(item),
  };
}

function mapFinancialLineItem(
  item: QuoteFinancialLineItem
): QuoteSnapshotItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    priceMode: item.priceMode,
    taxIncluded: item.taxIncluded,
    vatRate: item.vatRate,
    unitPriceNet: item.unitPriceNet,
    unitTaxAmount: item.unitTaxAmount,
    unitPriceGross: item.unitPriceGross,
    totalPriceNet: item.totalPriceNet,
    totalTaxAmount: item.totalTaxAmount,
    totalPriceGross: item.totalPriceGross,
    websiteUnitPriceGross: item.websiteUnitPriceGross,
    websiteTotalPriceGross: item.websiteTotalPriceGross,
  };
}

export function createQuoteSnapshot(quote: Quote): QuoteSnapshot {
  const financials = quote.financials;

  if (!financials) {
    return {
      version: 1,
      priceMode: "gross",
      configuration: quote.configuration,
      configurationSummary: getConfigurationSummaryRows(quote.configuration),
      items: quote.items.map(mapLegacyQuoteItem),
      totalGross: quote.totalGross,
      currency: quote.currency,
    };
  }

  return {
    version: CURRENT_QUOTE_SNAPSHOT_VERSION,
    priceMode: financials.priceMode,
    defaultVatRate: financials.defaultVatRate,
    taxIncluded: financials.taxIncluded,
    configuration: quote.configuration,
    configurationSummary: getConfigurationSummaryRows(quote.configuration),
    items: financials.items.map(mapFinancialLineItem),
    websiteItems: quote.items.map(mapWebsiteQuoteItem),
    totalNet: financials.totalNet,
    totalTaxAmount: financials.totalTaxAmount,
    totalGross: financials.totalGross,
    websiteTotalGross: quote.totalGross,
    currency: quote.currency,
  };
}

export function getQuoteSnapshotWebsiteTotalGross(
  quote: QuoteSnapshot
): number {
  return quote.websiteTotalGross ?? quote.totalGross;
}

export function hasDetailedQuoteFinancials(
  quote: QuoteSnapshot
): quote is QuoteSnapshot & {
  version: 2;
  priceMode: "net";
  defaultVatRate: number;
  taxIncluded: false;
  totalNet: number;
  totalTaxAmount: number;
  websiteTotalGross: number;
  websiteItems: QuoteSnapshotWebsiteItem[];
} {
  return (
    quote.version === CURRENT_QUOTE_SNAPSHOT_VERSION &&
    quote.priceMode === "net" &&
    quote.taxIncluded === false &&
    Number.isFinite(quote.defaultVatRate) &&
    Number.isFinite(quote.totalNet) &&
    Number.isFinite(quote.totalTaxAmount) &&
    Number.isFinite(quote.totalGross) &&
    Number.isFinite(quote.websiteTotalGross) &&
    Array.isArray(quote.websiteItems)
  );
}


/**
 * Przelicza historyczny snapshot v2 na wskazaną stawkę VAT bez zmiany cen
 * netto. Zaokrąglenie odbywa się na poziomie każdej pozycji, tak samo jak w
 * wierszach produktowych Bitrix24. Dla snapshotów legacy zwraca `null`, bo nie
 * zawierają wiarygodnych cen netto.
 */
export function recalculateQuoteSnapshotForVat(
  quote: QuoteSnapshot,
  vatRate: number
): RecalculatedQuoteFinancials | null {
  assertValidVatRate(vatRate);

  if (!hasDetailedQuoteFinancials(quote)) {
    return null;
  }

  const items = quote.items.map((item) => {
    if (!Number.isFinite(item.totalPriceNet)) {
      throw new Error(
        `Pozycja snapshotu ${item.id} nie zawiera prawidłowej wartości netto.`
      );
    }

    const totalPriceNet = roundMoney(item.totalPriceNet as number);
    const totalTaxAmount = roundMoney(totalPriceNet * (vatRate / 100));
    const totalPriceGross = roundMoney(totalPriceNet + totalTaxAmount);

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      totalPriceNet,
      totalTaxAmount,
      totalPriceGross,
    };
  });

  const totalNet = roundMoney(
    items.reduce((sum, item) => sum + item.totalPriceNet, 0)
  );
  const totalTaxAmount = roundMoney(
    items.reduce((sum, item) => sum + item.totalTaxAmount, 0)
  );
  const totalGross = roundMoney(
    items.reduce((sum, item) => sum + item.totalPriceGross, 0)
  );

  if (totalGross !== roundMoney(totalNet + totalTaxAmount)) {
    throw new Error(
      "Przeliczone podsumowanie snapshotu nie jest spójne: netto + VAT != brutto."
    );
  }

  return { vatRate, totalNet, totalTaxAmount, totalGross, items };
}

function assertValidVatRate(vatRate: number): void {
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw new Error(`Nieprawidłowa stawka VAT: ${String(vatRate)}.`);
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
