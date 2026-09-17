import {
  getFrameColor,
  getFrameColorLabel,
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
  html: string;
}

interface MessageData {
  lead: StoredCalculatorInquiryLead;
  configuration: ProductConfiguration | undefined;
  productKind: string | null;
  totalGross: number | undefined;
  items: NormalizedQuoteItem[];
}

export function createCalculatorInquiryNotificationMessage(
  lead: StoredCalculatorInquiryLead
): CalculatorInquiryNotificationMessage {
  const data = createMessageData(lead);

  const subject = `Nowe zapytanie z kalkulatora: ${
    lead.customer.name
  } - ${formatOptionalMoney(data.totalGross)}`;

  return {
    subject,
    text: createInternalTextMessage(data),
    html: createInternalHtmlMessage(data),
  };
}

export function createCalculatorInquiryCustomerMessage(
  lead: StoredCalculatorInquiryLead
): CalculatorInquiryNotificationMessage {
  const data = createMessageData(lead);
  const productLabel = formatProductKind(data.productKind);

  return {
    subject: `MoonGlass — podsumowanie konfiguracji: ${productLabel}`,
    text: createCustomerTextMessage(data),
    html: createCustomerHtmlMessage(data),
  };
}

function createMessageData(lead: StoredCalculatorInquiryLead): MessageData {
  const quote = lead.quote as QuoteSnapshotForNotification;
  const configuration = quote.configuration;
  const productKind = configuration ? getProductKind(configuration) : null;
  const totalGross = quote.totalGross ?? lead.quote.totalGross;
  const items = normalizeQuoteItems(quote.items ?? []);

  return {
    lead,
    configuration,
    productKind,
    totalGross,
    items,
  };
}

function createInternalTextMessage(data: MessageData): string {
  return [
    "Nowe zapytanie z kalkulatora",
    "",
    "Dane zapytania",
    "------------",
    `ID zapytania: ${data.lead.id}`,
    `Data przyjęcia: ${data.lead.receivedAt}`,
    `Status: ${data.lead.status}`,
    `Źródło: ${data.lead.source}`,
    "",
    "Klient",
    "------",
    `Imię i nazwisko: ${data.lead.customer.name}`,
    `Telefon: ${data.lead.customer.phone}`,
    `E-mail: ${data.lead.customer.email}`,
    `Wiadomość: ${data.lead.customer.message || "-"}`,
    "",
    "Oferta",
    "------",
    `Typ produktu: ${formatProductKind(data.productKind)}`,
    `Suma brutto: ${formatOptionalMoney(data.totalGross)}`,
    "",
    "Konfiguracja",
    "------------",
    ...createConfigurationLines(data.configuration),
    "",
    "Pozycje oferty",
    "--------------",
    ...createQuoteItemLines(data.items),
  ].join("\n");
}

function createInternalHtmlMessage(data: MessageData): string {
  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(
      `Nowe zapytanie z kalkulatora: ${data.lead.customer.name}`
    )}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="720" cellspacing="0" cellpadding="0" style="width:720px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:28px 32px;background:#111827;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#d1d5db;">
                  Nowe zapytanie z kalkulatora
                </div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">
                  ${escapeHtml(data.lead.customer.name)}
                </h1>
                <div style="margin-top:10px;font-size:20px;font-weight:700;color:#ffffff;">
                  ${escapeHtml(formatOptionalMoney(data.totalGross))}
                </div>
              </td>
            </tr>

            ${createHtmlSection("Dane zapytania", [
              ["ID zapytania", data.lead.id],
              ["Data przyjęcia", data.lead.receivedAt],
              ["Status", data.lead.status],
              ["Źródło", data.lead.source],
            ])}

            ${createHtmlSection("Klient", [
              ["Imię i nazwisko", data.lead.customer.name],
              ["Telefon", data.lead.customer.phone],
              ["E-mail", data.lead.customer.email],
              ["Wiadomość", data.lead.customer.message || "-"],
            ])}

            ${createHtmlSection("Oferta", [
              ["Typ produktu", formatProductKind(data.productKind)],
              ["Suma brutto", formatOptionalMoney(data.totalGross)],
            ])}

            ${createHtmlConfigurationSection(data.configuration)}

            ${createHtmlQuoteItemsSection(data.items)}

            <tr>
              <td style="padding:20px 32px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5;">
                To powiadomienie zostało wygenerowane automatycznie przez kalkulator.
                Przed wysłaniem oferty do klienta sprawdź konfigurację, ceny, VAT i możliwość techniczną realizacji.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function createCustomerTextMessage(data: MessageData): string {
  return [
    `Dzień dobry ${data.lead.customer.name},`,
    "",
    "dziękujemy za przygotowanie konfiguracji w kalkulatorze MoonGlass.",
    "Poniżej przesyłamy automatyczne podsumowanie zgłoszenia.",
    "",
    `Typ produktu: ${formatProductKind(data.productKind)}`,
    `Szacunkowa wycena brutto: ${formatOptionalMoney(data.totalGross)}`,
    "",
    "Wybrana konfiguracja",
    "--------------------",
    ...createCustomerConfigurationLines(data.configuration),
    "",
    "Podsumowanie wyceny",
    "-------------------",
    ...createQuoteItemLines(data.items),
    "",
    "Co dalej?",
    "Sprawdzimy konfigurację pod kątem technicznym i skontaktujemy się z Tobą, aby potwierdzić szczegóły realizacji.",
    "",
    "Podana kwota jest automatyczną wyceną kalkulatora i wymaga potwierdzenia po weryfikacji technicznej. Nie stanowi wiążącej oferty handlowej.",
    "",
    "W razie pytań odpowiedz bezpośrednio na tę wiadomość.",
    "",
    "MoonGlass",
  ].join("\n");
}

function createCustomerHtmlMessage(data: MessageData): string {
  const customerName = escapeHtml(data.lead.customer.name);
  const productKind = escapeHtml(formatProductKind(data.productKind));
  const totalGross = escapeHtml(formatOptionalMoney(data.totalGross));
  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Podsumowanie konfiguracji MoonGlass</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f0e7;font-family:Arial,Helvetica,sans-serif;color:#1c2925;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f0e7;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:680px;max-width:100%;background:#fffdf8;border:1px solid #ded8c9;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:32px 34px;background:#173d34;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#d6bf86;">
                  MoonGlass
                </div>
                <h1 style="margin:10px 0 0;font-size:27px;line-height:1.25;font-weight:600;">
                  Dziękujemy za Twoją konfigurację
                </h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#e8efec;">
                  Dzień dobry ${customerName}. Otrzymaliśmy Twoje zapytanie i zapisaliśmy jego konfigurację.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:30px 34px 14px;">
                <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a7547;">
                  Szacunkowa wycena brutto
                </div>
                <div style="margin-top:8px;font-size:32px;line-height:1.15;font-weight:700;color:#173d34;">
                  ${totalGross}
                </div>
                <div style="margin-top:8px;font-size:14px;color:#68756f;">
                  ${productKind}
                </div>
              </td>
            </tr>

            ${createCustomerHtmlConfigurationSection(data.configuration)}

            ${createCustomerHtmlQuoteItemsSection(data.items)}

            <tr>
              <td style="padding:24px 34px;border-top:1px solid #ebe5d9;">
                <h2 style="margin:0 0 10px;font-size:18px;color:#173d34;">Co dalej?</h2>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#43524c;">
                  Sprawdzimy konfigurację pod kątem technicznym i skontaktujemy się z Tobą,
                  aby potwierdzić szczegóły realizacji.
                </p>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:#43524c;">
                  Jeśli chcesz coś doprecyzować, po prostu odpowiedz na tę wiadomość.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 34px;background:#f0eadf;color:#6d746f;font-size:12px;line-height:1.6;">
                Podana kwota jest automatyczną wyceną kalkulatora i wymaga potwierdzenia po weryfikacji technicznej.
                Nie stanowi wiążącej oferty handlowej.
              </td>
            </tr>

            <tr>
              <td style="padding:22px 34px;background:#173d34;color:#dfe9e5;font-size:13px;line-height:1.6;">
                <strong style="color:#ffffff;">MoonGlass</strong><br />
                Nowoczesne zadaszenia tarasowe i ogrody zimowe.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function createConfigurationLines(
  configuration: ProductConfiguration | undefined
): string[] {
  if (!configuration) {
    return ["Brak konfiguracji w zapytaniu."];
  }

  return [
    `Wymiary: ${configuration.length} x ${configuration.width} cm`,
    `Kolor konstrukcji: ${getFrameColorLabel(getFrameColor(configuration))}`,
    `Dach: ${formatRoof(configuration.roof)}`,
    `Ściany: ${formatWalls(configuration.walls)}`,
    `ZIP przód: ${formatBoolean(configuration.hasFrontZip)}`,
    `ZIP lewy: ${formatBoolean(configuration.hasLeftZip)}`,
    `ZIP prawy: ${formatBoolean(configuration.hasRightZip)}`,
    `Markiza: ${formatBoolean(configuration.hasAwning)}`,
    `LED: ${formatBoolean(configuration.hasLed)}`,
    `LED CCT: ${formatBoolean(configuration.hasCob)}`,
    `Uchwyty: ${formatBoolean(configuration.hasHandles)}`,
    `Szczotki: ${formatBoolean(configuration.hasBrushes)}`,
    `Profil wyrównujący: ${formatBoolean(configuration.hasLevelingProfile)}`,
  ];
}


function createCustomerConfigurationLines(
  configuration: ProductConfiguration | undefined
): string[] {
  if (!configuration) {
    return ["Brak konfiguracji w zapytaniu."];
  }

  const lines = [
    `Wymiary: ${configuration.length} x ${configuration.width} cm`,
    `Kolor konstrukcji: ${getFrameColorLabel(getFrameColor(configuration))}`,
    `Dach: ${formatRoof(configuration.roof)}`,
    `Ściany: ${formatWalls(configuration.walls)}`,
  ];

  const selectedExtras = createSelectedExtras(configuration);

  if (selectedExtras.length > 0) {
    lines.push(`Wybrane dodatki: ${selectedExtras.join(", ")}`);
  }

  return lines;
}

function createSelectedExtras(
  configuration: ProductConfiguration
): string[] {
  const extras: string[] = [];

  if (configuration.hasFrontZip) extras.push("ZIP przód");
  if (configuration.hasLeftZip) extras.push("ZIP lewy");
  if (configuration.hasRightZip) extras.push("ZIP prawy");
  if (configuration.hasAwning) extras.push("Markiza");
  if (configuration.hasLed) extras.push("LED");
  if (configuration.hasCob) extras.push("LED CCT");
  if (configuration.hasHandles) extras.push("Uchwyty");
  if (configuration.hasBrushes) extras.push("Szczotki");
  if (configuration.hasLevelingProfile) extras.push("Profil wyrównujący");

  return extras;
}

function createQuoteItemLines(items: NormalizedQuoteItem[]): string[] {
  if (items.length === 0) {
    return ["Brak pozycji oferty."];
  }

  return items.map((item, index) => {
    return `${index + 1}. ${item.name} | ilość: ${
      item.quantity
    } | cena jedn.: ${formatOptionalMoney(
      item.unitPriceGross
    )} | razem: ${formatOptionalMoney(item.totalGross)}`;
  });
}

function createHtmlConfigurationSection(
  configuration: ProductConfiguration | undefined
): string {
  if (!configuration) {
    return createHtmlSection("Konfiguracja", [
      ["Konfiguracja", "Brak konfiguracji w zapytaniu."],
    ]);
  }

  return createHtmlSection("Konfiguracja", [
    ["Wymiary", `${configuration.length} x ${configuration.width} cm`],
    ["Kolor konstrukcji", getFrameColorLabel(getFrameColor(configuration))],
    ["Dach", formatRoof(configuration.roof)],
    ["Ściany", formatWalls(configuration.walls)],
    ["ZIP przód", formatBoolean(configuration.hasFrontZip)],
    ["ZIP lewy", formatBoolean(configuration.hasLeftZip)],
    ["ZIP prawy", formatBoolean(configuration.hasRightZip)],
    ["Markiza", formatBoolean(configuration.hasAwning)],
    ["LED", formatBoolean(configuration.hasLed)],
    ["LED CCT", formatBoolean(configuration.hasCob)],
    ["Uchwyty", formatBoolean(configuration.hasHandles)],
    ["Szczotki", formatBoolean(configuration.hasBrushes)],
    ["Profil wyrównujący", formatBoolean(configuration.hasLevelingProfile)],
  ]);
}

function createCustomerHtmlConfigurationSection(
  configuration: ProductConfiguration | undefined
): string {
  if (!configuration) {
    return createCustomerHtmlRowsSection("Wybrana konfiguracja", [
      ["Konfiguracja", "Brak konfiguracji w zapytaniu."],
    ]);
  }

  const rows: Array<[label: string, value: string]> = [
    ["Wymiary", `${configuration.length} × ${configuration.width} cm`],
    ["Kolor konstrukcji", getFrameColorLabel(getFrameColor(configuration))],
    ["Dach", formatRoof(configuration.roof)],
    ["Ściany", formatWalls(configuration.walls)],
  ];

  const selectedExtras = createSelectedExtras(configuration);

  if (selectedExtras.length > 0) {
    rows.push(["Wybrane dodatki", selectedExtras.join(", ")]);
  }

  return createCustomerHtmlRowsSection("Wybrana konfiguracja", rows);
}

function createHtmlQuoteItemsSection(items: NormalizedQuoteItem[]): string {
  if (items.length === 0) {
    return createHtmlSection("Pozycje oferty", [
      ["Pozycje", "Brak pozycji oferty."],
    ]);
  }

  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">${index + 1}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(
            item.name
          )}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(
            String(item.quantity)
          )}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(
            formatOptionalMoney(item.unitPriceGross)
          )}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:700;">${escapeHtml(
            formatOptionalMoney(item.totalGross)
          )}</td>
        </tr>`
    )
    .join("");

  return `
    <tr>
      <td style="padding:24px 32px;">
        <h2 style="margin:0 0 14px;font-size:18px;color:#111827;">Pozycje oferty</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          <thead>
            <tr>
              <th align="left" style="padding:0 0 8px;color:#6b7280;font-weight:400;">#</th>
              <th align="left" style="padding:0 0 8px;color:#6b7280;font-weight:400;">Nazwa</th>
              <th align="right" style="padding:0 0 8px;color:#6b7280;font-weight:400;">Ilość</th>
              <th align="right" style="padding:0 0 8px;color:#6b7280;font-weight:400;">Cena jedn.</th>
              <th align="right" style="padding:0 0 8px;color:#6b7280;font-weight:400;">Razem</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </td>
    </tr>`;
}

function createCustomerHtmlQuoteItemsSection(
  items: NormalizedQuoteItem[]
): string {
  if (items.length === 0) {
    return "";
  }

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ebe5d9;color:#273b34;">
            ${escapeHtml(item.name)}
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #ebe5d9;color:#173d34;font-weight:700;white-space:nowrap;">
            ${escapeHtml(formatOptionalMoney(item.totalGross))}
          </td>
        </tr>`
    )
    .join("");

  return `
    <tr>
      <td style="padding:24px 34px;border-top:1px solid #ebe5d9;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#173d34;">Podsumowanie wyceny</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          <tbody>${rows}</tbody>
        </table>
      </td>
    </tr>`;
}

function createHtmlSection(
  title: string,
  rows: Array<[label: string, value: string]>
): string {
  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 0;color:#6b7280;width:220px;">${escapeHtml(
            label
          )}</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;">${escapeHtml(
            value
          )}</td>
        </tr>`
    )
    .join("");

  return `
    <tr>
      <td style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">${escapeHtml(
          title
        )}</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
          ${htmlRows}
        </table>
      </td>
    </tr>`;
}

function createCustomerHtmlRowsSection(
  title: string,
  rows: Array<[label: string, value: string]>
): string {
  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:7px 0;color:#7b837f;width:210px;vertical-align:top;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:7px 0;color:#273b34;font-weight:600;">
            ${escapeHtml(value)}
          </td>
        </tr>`
    )
    .join("");

  return `
    <tr>
      <td style="padding:24px 34px;border-top:1px solid #ebe5d9;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#173d34;">
          ${escapeHtml(title)}
        </h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
          ${htmlRows}
        </table>
      </td>
    </tr>`;
}

function normalizeQuoteItems(items: unknown[]): NormalizedQuoteItem[] {
  return items.map(normalizeQuoteItem);
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
    name:
      readString(rawItem, ["name", "label", "title"]) ?? `Pozycja ${index + 1}`,
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

  return "Konfiguracja MoonGlass";
}

function formatRoof(roof: ProductConfiguration["roof"]): string {
  const labels: Record<ProductConfiguration["roof"], string> = {
    polycarbonate_clear: "Poliwęglan bezbarwny",
    polycarbonate_milky: "Poliwęglan mleczny",
    polycarbonate_grey: "Poliwęglan szary",
    polycarbonate_smoke: "Poliwęglan dymiony",
    glass_clear: "Szkło przezroczyste",
    glass_milky: "Szkło mleczne",
    glass_tinted: "Szkło przyciemniane",
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
