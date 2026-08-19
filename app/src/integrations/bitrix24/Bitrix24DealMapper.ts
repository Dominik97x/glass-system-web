import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import {
  getFrameColor,
  getFrameColorLabel,
} from "@/domain/ProductConfiguration";
import {
  getQuoteSnapshotWebsiteTotalGross,
  recalculateQuoteSnapshotForVat,
  type RecalculatedQuoteFinancials,
} from "@/lib/quote-snapshot";
import type { Bitrix24Config } from "./Bitrix24Config";
import type { Bitrix24ItemAddPayload } from "./Bitrix24Types";

export function mapInquiryToBitrix24DealPayload(
  inquiry: StoredCalculatorInquiryLead,
  config: Bitrix24Config
): Bitrix24ItemAddPayload {
  const targetFinancials = recalculateQuoteSnapshotForVat(
    inquiry.quote,
    config.vatRate
  );
  const bitrixTotalGross =
    targetFinancials?.totalGross ?? inquiry.quote.totalGross;

  return {
    entityTypeId: config.dealEntityTypeId,
    useOriginalUfNames: "Y",
    fields: removeUndefinedFields({
      title: createDealTitle(inquiry),
      // Kwota Deala musi odpowiadać stawce VAT użytej w jego pozycjach.
      opportunity: bitrixTotalGross,
      currencyId: inquiry.quote.currency,
      categoryId: config.defaultCategoryId,
      stageId: config.defaultStageId,
      assignedById: config.assignedById,
      sourceId: config.sourceId,
      comments: createDealDescription(inquiry, targetFinancials),
      UF_CRM_DEAL_MG_CONSTRUCTION_COLOR:
        getFrameColorLabel(getFrameColor(inquiry.quote.configuration)),
      UF_CRM_DEAL_MG_CUSTOM_QUOTE: "N",
    }),
  };
}

function createDealTitle(inquiry: StoredCalculatorInquiryLead): string {
  const productType = getSummaryValue(inquiry, "Typ produktu");
  const configuration = inquiry.quote.configuration;
  const dimensions = `${configuration.length} × ${configuration.width} cm`;

  if (productType) {
    return `${productType} ${dimensions} — ${inquiry.customer.name}`;
  }

  return `Zapytanie ${dimensions} — ${inquiry.customer.name}`;
}

function createDealDescription(
  inquiry: StoredCalculatorInquiryLead,
  targetFinancials: RecalculatedQuoteFinancials | null
): string {
  const configurationSummary = inquiry.quote.configurationSummary
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");

  const quoteItems = targetFinancials
    ? targetFinancials.items
        .map(
          (item) =>
            `${item.name}: netto ${formatMoney(item.totalPriceNet)} ${
              inquiry.quote.currency
            }, VAT ${targetFinancials.vatRate}% ${formatMoney(
              item.totalTaxAmount
            )} ${inquiry.quote.currency}, brutto ${formatMoney(
              item.totalPriceGross
            )} ${inquiry.quote.currency}`
        )
        .join("\n")
    : inquiry.quote.items
        .map((item) => formatQuoteItem(item, inquiry.quote.currency))
        .join("\n");

  const financialSummary = targetFinancials
    ? [
        `Razem netto: ${formatMoney(targetFinancials.totalNet)} ${
          inquiry.quote.currency
        }`,
        `VAT ${targetFinancials.vatRate}%: ${formatMoney(
          targetFinancials.totalTaxAmount
        )} ${inquiry.quote.currency}`,
        `Razem brutto Deala: ${formatMoney(targetFinancials.totalGross)} ${
          inquiry.quote.currency
        }`,
        `Wycena orientacyjna na stronie: ${formatMoney(
          getQuoteSnapshotWebsiteTotalGross(inquiry.quote)
        )} ${inquiry.quote.currency}`,
      ]
    : [
        `Razem brutto: ${formatMoney(inquiry.quote.totalGross)} ${
          inquiry.quote.currency
        }`,
      ];

  return [
    "Źródło: Kalkulator strony internetowej",
    `Numer zapytania: ${inquiry.id}`,
    `Data przyjęcia: ${inquiry.receivedAt}`,
    "",
    "Klient:",
    `Imię i nazwisko: ${inquiry.customer.name}`,
    `E-mail: ${inquiry.customer.email}`,
    `Telefon: ${inquiry.customer.phone}`,
    `Wiadomość: ${inquiry.customer.message || "Brak"}`,
    "",
    "Konfiguracja:",
    configurationSummary,
    "",
    "Wycena:",
    quoteItems,
    "",
    ...financialSummary,
  ].join("\n");
}

function formatQuoteItem(
  item: StoredCalculatorInquiryLead["quote"]["items"][number],
  currency: string
): string {
  if (
    Number.isFinite(item.totalPriceNet) &&
    Number.isFinite(item.totalTaxAmount) &&
    Number.isFinite(item.vatRate)
  ) {
    return `${item.name}: netto ${formatMoney(
      item.totalPriceNet as number
    )} ${currency}, VAT ${item.vatRate}% ${formatMoney(
      item.totalTaxAmount as number
    )} ${currency}, brutto ${formatMoney(item.totalPriceGross)} ${currency}`;
  }

  return `${item.name}: ${formatMoney(item.totalPriceGross)} ${currency}`;
}

function getSummaryValue(
  inquiry: StoredCalculatorInquiryLead,
  label: string
): string | null {
  return (
    inquiry.quote.configurationSummary.find((row) => row.label === label)
      ?.value ?? null
  );
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function removeUndefinedFields(
  fields: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}
