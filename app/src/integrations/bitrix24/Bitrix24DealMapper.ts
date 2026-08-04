import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type { Bitrix24Config } from "./Bitrix24Config";
import type { Bitrix24ItemAddPayload } from "./Bitrix24Types";

export function mapInquiryToBitrix24DealPayload(
  inquiry: StoredCalculatorInquiryLead,
  config: Bitrix24Config
): Bitrix24ItemAddPayload {
  return {
    entityTypeId: config.dealEntityTypeId,
    fields: removeUndefinedFields({
      title: createDealTitle(inquiry),
      opportunity: inquiry.quote.totalGross,
      currencyId: inquiry.quote.currency,
      categoryId: config.defaultCategoryId,
      stageId: config.defaultStageId,
      assignedById: config.assignedById,
      sourceId: config.sourceId,
      comments: createDealDescription(inquiry),
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
  inquiry: StoredCalculatorInquiryLead
): string {
  const configurationSummary = inquiry.quote.configurationSummary
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");

  const quoteItems = inquiry.quote.items
    .map(
      (item) =>
        `${item.name}: ${item.totalPriceGross} ${inquiry.quote.currency}`
    )
    .join("\n");

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
    `Razem: ${inquiry.quote.totalGross} ${inquiry.quote.currency}`,
  ].join("\n");
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

function removeUndefinedFields(
  fields: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}