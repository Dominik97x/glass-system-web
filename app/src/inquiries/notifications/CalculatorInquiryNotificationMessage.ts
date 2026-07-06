import {
  getProductKind,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";

interface QuoteSnapshotForNotification {
  configuration?: ProductConfiguration;
  items?: unknown[];
  totalGross?: number;
}

interface NormalizedQuoteItem {
  name: string;
  quantity: number;
  unitPriceGross: number | null;
  totalGross: number | null;
}

export interface CalculatorInquiryNotificationMessage {
  subject: string;
  text: string;
}

export function createCalculatorInquiryNotificationMessage(
  lead: StoredCalculatorInquiryLead
): CalculatorInquiryNotificationMessage {
  const quote = lead.quote as QuoteSnapshotForNotification;
  const configuration = quote.configuration;
  const productKind = configuration ? getProductKind(configuration) : null;
  const totalGross = quote.totalGross ?? lead.quote.totalGross;

  const subject = `Nowe zapytanie z kalkulatora: ${
    lead.customer.name
  } - ${formatOptionalMoney(totalGross)}`;

  const text = [
    "Nowe zapytanie z kalkulatora",
    "",
    "Dane zapytania",
    "------------",
    `ID zapytania: ${lead.id}`,
    `Data przyjęcia: ${lead.receivedAt}`,
    `Status: ${lead.status}`,
    `Źródło: ${lead.source}`,
    "",
    "Klient",
    "------",
    `Imię i nazwisko: ${lead.customer.name}`,
    `Telefon: ${lead.customer.phone}`,
    `E-mail: ${lead.customer.email}`,
    `Wiadomość: ${lead.customer.message || "-"}`,
    "",
    "Oferta",
    "------",
    `Typ produktu: ${formatProductKind(productKind)}`,
    `Suma brutto: ${formatOptionalMoney(totalGross)}`,
    "",
    "Konfiguracja",
    "------------",
    ...createConfigurationLines(configuration),
    "",
    "Pozycje oferty",
    "--------------",
    ...createQuoteItemLines(quote.items ?? []),
  ].join("\n");

  return {
    subject,
    text,
  };
}

function createConfigurationLines(
  configuration: ProductConfiguration | undefined
): string[] {
  if (!configuration) {
    return ["Brak konfiguracji w zapytaniu."];
  }

  return [
    `Wymiary: ${configuration.length} x ${configuration.width} cm`,
    `Dach: ${formatRoof(configuration.roof)}`,
    `Ściany: ${formatWalls(configuration.walls)}`,
    `ZIP przód: ${formatBoolean(configuration.hasFrontZip)}`,
    `ZIP lewy: ${formatBoolean(configuration.hasLeftZip)}`,
    `ZIP prawy: ${formatBoolean(configuration.hasRightZip)}`,
    `Markiza: ${formatBoolean(configuration.hasAwning)}`,
    `LED: ${formatBoolean(configuration.hasLed)}`,
    `COB: ${formatBoolean(configuration.hasCob)}`,
    `Uchwyty: ${formatBoolean(configuration.hasHandles)}`,
    `Szczotki: ${formatBoolean(configuration.hasBrushes)}`,
    `Profil wyrównujący: ${formatBoolean(configuration.hasLevelingProfile)}`,
  ];
}

function createQuoteItemLines(items: unknown[]): string[] {
  if (items.length === 0) {
    return ["Brak pozycji oferty."];
  }

  return items.map((rawItem, index) => {
    const item = normalizeQuoteItem(rawItem, index);

    return `${index + 1}. ${item.name} | ilość: ${
      item.quantity
    } | cena jedn.: ${formatOptionalMoney(
      item.unitPriceGross
    )} | razem: ${formatOptionalMoney(item.totalGross)}`;
  });
}

function normalizeQuoteItem(
  rawItem: unknown,
  index: number
): NormalizedQuoteItem {
  if (!isRecord(rawItem)) {
    return {
      name: `Pozycja ${index + 1}`,
      quantity: 1,
      unitPriceGross: null,
      totalGross: null,
    };
  }

  const quantity = readNumber(rawItem, ["quantity"]) ?? 1;
  const unitPriceGross = readNumber(rawItem, [
    "unitPriceGross",
    "priceGross",
    "unitGross",
  ]);

  const explicitTotalGross = readNumber(rawItem, [
    "totalGross",
    "totalPriceGross",
    "grossTotal",
  ]);

  const totalGross =
    explicitTotalGross ??
    (unitPriceGross !== null ? roundMoney(unitPriceGross * quantity) : null);

  return {
    name: readString(rawItem, ["name", "label", "title"]) ?? `Pozycja ${index + 1}`,
    quantity,
    unitPriceGross,
    totalGross,
  };
}

function readString(
  record: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function readNumber(
  record: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatProductKind(productKind: string | null): string {
  if (productKind === "terrace_roof") {
    return "Zadaszenie tarasu";
  }

  if (productKind === "winter_garden") {
    return "Ogród zimowy";
  }

  return "Nieznany";
}

function formatRoof(roof: ProductConfiguration["roof"]): string {
  const labels: Record<ProductConfiguration["roof"], string> = {
    polycarbonate_clear: "Poliwęglan bezbarwny",
    polycarbonate_milky: "Poliwęglan mleczny",
    polycarbonate_grey: "Poliwęglan grafitowy",
    polycarbonate_smoke: "Poliwęglan dymiony",
    glass_clear: "Szkło przezroczyste",
    glass_milky: "Szkło mleczne",
  };

  return labels[roof];
}

function formatWalls(walls: ProductConfiguration["walls"]): string {
  const labels: Record<ProductConfiguration["walls"], string> = {
    none: "Brak ścian",
    glass_clear: "Szkło przezroczyste",
    glass_milky: "Szkło mleczne",
    glass_tinted: "Szkło przyciemniane",
  };

  return labels[walls];
}

function formatBoolean(value: boolean): string {
  return value ? "Tak" : "Nie";
}

function formatOptionalMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}