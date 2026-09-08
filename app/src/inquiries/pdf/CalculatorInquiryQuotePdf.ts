import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import {
  getFrameColor,
  getFrameColorLabel,
  getProductKind,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 46;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_X * 2;

const COLORS = {
  cream: rgb(0.965, 0.945, 0.902),
  paper: rgb(0.996, 0.988, 0.965),
  green: rgb(0.09, 0.235, 0.20),
  greenSoft: rgb(0.19, 0.34, 0.30),
  gold: rgb(0.70, 0.57, 0.29),
  text: rgb(0.10, 0.16, 0.14),
  muted: rgb(0.41, 0.46, 0.44),
  line: rgb(0.86, 0.84, 0.78),
  white: rgb(1, 1, 1),
};

interface QuoteSnapshotForPdf {
  configuration?: ProductConfiguration;
  items?: unknown[];
  totalGross?: number;
}

interface NormalizedQuoteItem {
  name: string;
  quantity: number;
  totalGross: number | null;
}

interface PdfFonts {
  regular: PDFFont;
  semibold: PDFFont;
}

interface PdfCursor {
  page: PDFPage;
  y: number;
  pageNumber: number;
}

export interface CalculatorInquiryQuotePdf {
  bytes: Uint8Array;
  filename: string;
  documentNumber: string;
}

export async function createCalculatorInquiryQuotePdf(
  lead: StoredCalculatorInquiryLead
): Promise<CalculatorInquiryQuotePdf> {
  const quote = lead.quote as QuoteSnapshotForPdf;
  const configuration = quote.configuration;
  const items = normalizeQuoteItems(quote.items ?? []);
  const totalGross = quote.totalGross ?? lead.quote.totalGross;
  const productKind = configuration ? getProductKind(configuration) : null;

  const documentNumber = createDocumentNumber(lead);
  const filename = `MoonGlass-${documentNumber}.pdf`;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fonts = await embedFonts(pdfDoc);

  pdfDoc.setTitle(`MoonGlass - podsumowanie konfiguracji ${documentNumber}`);
  pdfDoc.setAuthor("MoonGlass");
  pdfDoc.setSubject("Podsumowanie konfiguracji i szacunkowej wyceny");
  pdfDoc.setCreator("MoonGlass calculator");

  let cursor = createPage(pdfDoc, fonts, 1);

  cursor = drawHero(cursor, fonts, {
    productKind: formatProductKind(productKind),
    totalGross: formatMoney(totalGross),
    documentNumber,
  });

  cursor = drawIntro(cursor, fonts, {
    customerName: lead.customer.name,
    receivedAt: lead.receivedAt,
  });

  cursor = drawConfiguration(cursor, pdfDoc, fonts, configuration);

  cursor = drawQuoteItems(cursor, pdfDoc, fonts, items);

  cursor = drawNextSteps(cursor, pdfDoc, fonts);

  drawFooter(cursor.page, fonts, cursor.pageNumber);

  const bytes = await pdfDoc.save();

  return {
    bytes,
    filename,
    documentNumber,
  };
}

async function embedFonts(pdfDoc: PDFDocument): Promise<PdfFonts> {
  const fontDir = path.join(
    process.cwd(),
    "node_modules",
    "geist",
    "dist",
    "fonts",
    "geist-sans"
  );

  const [regularBytes, semiboldBytes] = await Promise.all([
    readFile(path.join(fontDir, "Geist-Regular.ttf")),
    readFile(path.join(fontDir, "Geist-SemiBold.ttf")),
  ]);

  const [regular, semibold] = await Promise.all([
    pdfDoc.embedFont(regularBytes, { subset: true }),
    pdfDoc.embedFont(semiboldBytes, { subset: true }),
  ]);

  return { regular, semibold };
}

function createPage(
  pdfDoc: PDFDocument,
  fonts: PdfFonts,
  pageNumber: number
): PdfCursor {
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4_WIDTH,
    height: A4_HEIGHT,
    color: COLORS.paper,
  });

  if (pageNumber > 1) {
    page.drawText("MOONGLASS", {
      x: MARGIN_X,
      y: A4_HEIGHT - 42,
      size: 9,
      font: fonts.semibold,
      color: COLORS.gold,
    });

    page.drawText("Podsumowanie konfiguracji", {
      x: MARGIN_X,
      y: A4_HEIGHT - 61,
      size: 16,
      font: fonts.semibold,
      color: COLORS.green,
    });

    page.drawLine({
      start: { x: MARGIN_X, y: A4_HEIGHT - 76 },
      end: { x: A4_WIDTH - MARGIN_X, y: A4_HEIGHT - 76 },
      thickness: 0.8,
      color: COLORS.line,
    });
  }

  return {
    page,
    y: pageNumber === 1 ? A4_HEIGHT : A4_HEIGHT - 98,
    pageNumber,
  };
}

function drawHero(
  cursor: PdfCursor,
  fonts: PdfFonts,
  data: {
    productKind: string;
    totalGross: string;
    documentNumber: string;
  }
): PdfCursor {
  const headerHeight = 205;
  const yBottom = A4_HEIGHT - headerHeight;

  cursor.page.drawRectangle({
    x: 0,
    y: yBottom,
    width: A4_WIDTH,
    height: headerHeight,
    color: COLORS.green,
  });

  cursor.page.drawText("MOONGLASS", {
    x: MARGIN_X,
    y: A4_HEIGHT - 50,
    size: 10,
    font: fonts.semibold,
    color: COLORS.gold,
  });

  cursor.page.drawText("Podsumowanie konfiguracji", {
    x: MARGIN_X,
    y: A4_HEIGHT - 84,
    size: 25,
    font: fonts.semibold,
    color: COLORS.white,
  });

  cursor.page.drawText(data.productKind, {
    x: MARGIN_X,
    y: A4_HEIGHT - 112,
    size: 14,
    font: fonts.regular,
    color: rgb(0.88, 0.93, 0.91),
  });

  cursor.page.drawText("SZACUNKOWA WYCENA BRUTTO", {
    x: MARGIN_X,
    y: A4_HEIGHT - 150,
    size: 8,
    font: fonts.semibold,
    color: COLORS.gold,
  });

  cursor.page.drawText(data.totalGross, {
    x: MARGIN_X,
    y: A4_HEIGHT - 180,
    size: 25,
    font: fonts.semibold,
    color: COLORS.white,
  });

  const refWidth = fonts.regular.widthOfTextAtSize(data.documentNumber, 9);
  cursor.page.drawText(data.documentNumber, {
    x: A4_WIDTH - MARGIN_X - refWidth,
    y: A4_HEIGHT - 178,
    size: 9,
    font: fonts.regular,
    color: rgb(0.75, 0.83, 0.80),
  });

  return {
    ...cursor,
    y: yBottom - 28,
  };
}

function drawIntro(
  cursor: PdfCursor,
  fonts: PdfFonts,
  data: { customerName: string; receivedAt: string }
): PdfCursor {
  cursor.page.drawText(`Dzień dobry ${data.customerName},`, {
    x: MARGIN_X,
    y: cursor.y,
    size: 13,
    font: fonts.semibold,
    color: COLORS.text,
  });

  cursor.y -= 23;

  cursor.y = drawWrappedText(
    cursor.page,
    "dziękujemy za przygotowanie konfiguracji w kalkulatorze MoonGlass. Poniżej znajduje się zapis wybranych parametrów oraz automatycznie wyliczona wartość konfiguracji.",
    MARGIN_X,
    cursor.y,
    CONTENT_WIDTH,
    fonts.regular,
    10,
    15,
    COLORS.muted
  );

  cursor.y -= 8;

  cursor.page.drawText(`Data zgłoszenia: ${formatDate(data.receivedAt)}`, {
    x: MARGIN_X,
    y: cursor.y,
    size: 9,
    font: fonts.regular,
    color: COLORS.muted,
  });

  cursor.y -= 30;
  return cursor;
}

function drawConfiguration(
  cursor: PdfCursor,
  pdfDoc: PDFDocument,
  fonts: PdfFonts,
  configuration: ProductConfiguration | undefined
): PdfCursor {
  cursor = ensureSpace(cursor, pdfDoc, fonts, 165);

  cursor = drawSectionTitle(cursor, fonts, "Wybrana konfiguracja");

  if (!configuration) {
    cursor.y = drawWrappedText(
      cursor.page,
      "Brak konfiguracji w zapytaniu.",
      MARGIN_X,
      cursor.y,
      CONTENT_WIDTH,
      fonts.regular,
      10,
      15,
      COLORS.muted
    );
    cursor.y -= 24;
    return cursor;
  }

  const rows: Array<[string, string]> = [
    ["Wymiary", `${configuration.length} × ${configuration.width} cm`],
    ["Kolor konstrukcji", getFrameColorLabel(getFrameColor(configuration))],
    ["Dach", formatRoof(configuration.roof)],
    ["Ściany", formatWalls(configuration.walls)],
  ];

  const extras = createSelectedExtras(configuration);

  if (extras.length > 0) {
    rows.push(["Wybrane dodatki", extras.join(", ")]);
  }

  for (const [label, value] of rows) {
    cursor = ensureSpace(cursor, pdfDoc, fonts, 34);
    cursor = drawKeyValueRow(cursor, fonts, label, value);
  }

  cursor.y -= 12;
  return cursor;
}

function drawQuoteItems(
  cursor: PdfCursor,
  pdfDoc: PDFDocument,
  fonts: PdfFonts,
  items: NormalizedQuoteItem[]
): PdfCursor {
  cursor = ensureSpace(cursor, pdfDoc, fonts, 105);
  cursor = drawSectionTitle(cursor, fonts, "Podsumowanie wyceny");

  if (items.length === 0) {
    cursor.page.drawText("Brak pozycji wyceny.", {
      x: MARGIN_X,
      y: cursor.y,
      size: 10,
      font: fonts.regular,
      color: COLORS.muted,
    });
    cursor.y -= 28;
    return cursor;
  }

  for (const item of items) {
    const nameLines = wrapText(
      item.name,
      fonts.regular,
      9.5,
      CONTENT_WIDTH - 115
    );
    const rowHeight = Math.max(25, nameLines.length * 12 + 8);

    cursor = ensureSpace(cursor, pdfDoc, fonts, rowHeight + 4);

    cursor.page.drawLine({
      start: { x: MARGIN_X, y: cursor.y + 6 },
      end: { x: A4_WIDTH - MARGIN_X, y: cursor.y + 6 },
      thickness: 0.5,
      color: COLORS.line,
    });

    let textY = cursor.y - 7;
    for (const line of nameLines) {
      cursor.page.drawText(line, {
        x: MARGIN_X,
        y: textY,
        size: 9.5,
        font: fonts.regular,
        color: COLORS.text,
      });
      textY -= 12;
    }

    const amount = formatMoney(item.totalGross);
    const amountWidth = fonts.semibold.widthOfTextAtSize(amount, 9.5);

    cursor.page.drawText(amount, {
      x: A4_WIDTH - MARGIN_X - amountWidth,
      y: cursor.y - 7,
      size: 9.5,
      font: fonts.semibold,
      color: COLORS.green,
    });

    cursor.y -= rowHeight;
  }

  cursor.y -= 8;
  return cursor;
}

function drawNextSteps(
  cursor: PdfCursor,
  pdfDoc: PDFDocument,
  fonts: PdfFonts
): PdfCursor {
  cursor = ensureSpace(cursor, pdfDoc, fonts, 72);

  cursor.page.drawText("Co dalej?", {
    x: MARGIN_X,
    y: cursor.y,
    size: 12.5,
    font: fonts.semibold,
    color: COLORS.green,
  });

  cursor.y -= 18;

  cursor.y = drawWrappedText(
    cursor.page,
    "Sprawdzimy konfigurację pod kątem technicznym i skontaktujemy się z Tobą, aby potwierdzić szczegóły realizacji.",
    MARGIN_X,
    cursor.y,
    CONTENT_WIDTH,
    fonts.regular,
    8.5,
    11.5,
    COLORS.text
  );

  cursor.y -= 5;

  cursor.y = drawWrappedText(
    cursor.page,
    "Podana kwota jest automatyczną wyceną kalkulatora i wymaga potwierdzenia po weryfikacji technicznej. Dokument nie stanowi wiążącej oferty handlowej.",
    MARGIN_X,
    cursor.y,
    CONTENT_WIDTH,
    fonts.regular,
    7.2,
    9.5,
    COLORS.muted
  );

  cursor.y -= 7;
  return cursor;
}

function drawSectionTitle(
  cursor: PdfCursor,
  fonts: PdfFonts,
  title: string
): PdfCursor {
  cursor.page.drawText(title, {
    x: MARGIN_X,
    y: cursor.y,
    size: 14,
    font: fonts.semibold,
    color: COLORS.green,
  });

  cursor.y -= 22;
  return cursor;
}

function drawKeyValueRow(
  cursor: PdfCursor,
  fonts: PdfFonts,
  label: string,
  value: string
): PdfCursor {
  const labelWidth = 150;
  const valueX = MARGIN_X + labelWidth;

  cursor.page.drawText(label, {
    x: MARGIN_X,
    y: cursor.y,
    size: 9.5,
    font: fonts.regular,
    color: COLORS.muted,
  });

  const valueLines = wrapText(
    value,
    fonts.semibold,
    9.5,
    CONTENT_WIDTH - labelWidth
  );

  let valueY = cursor.y;
  for (const line of valueLines) {
    cursor.page.drawText(line, {
      x: valueX,
      y: valueY,
      size: 9.5,
      font: fonts.semibold,
      color: COLORS.text,
    });
    valueY -= 13;
  }

  cursor.y -= Math.max(21, valueLines.length * 12 + 5);
  return cursor;
}

function ensureSpace(
  cursor: PdfCursor,
  pdfDoc: PDFDocument,
  fonts: PdfFonts,
  requiredHeight: number
): PdfCursor {
  const minY = 48;

  if (cursor.y - requiredHeight >= minY) {
    return cursor;
  }

  drawFooter(cursor.page, fonts, cursor.pageNumber);
  return createPage(pdfDoc, fonts, cursor.pageNumber + 1);
}

function drawFooter(
  page: PDFPage,
  fonts: PdfFonts,
  pageNumber: number
): void {
  const footerY = 20;

  page.drawLine({
    start: { x: MARGIN_X, y: footerY + 16 },
    end: { x: A4_WIDTH - MARGIN_X, y: footerY + 16 },
    thickness: 0.5,
    color: COLORS.line,
  });

  page.drawText("MoonGlass · biuro@moonglass.pl", {
    x: MARGIN_X,
    y: footerY,
    size: 7.5,
    font: fonts.regular,
    color: COLORS.muted,
  });

  const pageLabel = `str. ${pageNumber}`;
  const width = fonts.regular.widthOfTextAtSize(pageLabel, 7.5);

  page.drawText(pageLabel, {
    x: A4_WIDTH - MARGIN_X - width,
    y: footerY,
    size: 7.5,
    font: fonts.regular,
    color: COLORS.muted,
  });
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  lineHeight: number,
  color = COLORS.text
): number {
  const lines = wrapText(text, font, size, maxWidth);
  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color,
    });
    currentY -= lineHeight;
  }

  return currentY;
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) {
      lines.push(line);
    }

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      line = word;
      continue;
    }

    const chunks = splitLongWord(word, font, size, maxWidth);
    lines.push(...chunks.slice(0, -1));
    line = chunks.at(-1) ?? "";
  }

  if (line) {
    lines.push(line);
  }

  return lines.length > 0 ? lines : [""];
}

function splitLongWord(
  word: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const chunks: string[] = [];
  let chunk = "";

  for (const char of word) {
    const candidate = `${chunk}${char}`;

    if (chunk && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = candidate;
    }
  }

  if (chunk) {
    chunks.push(chunk);
  }

  return chunks;
}

function normalizeQuoteItems(items: unknown[]): NormalizedQuoteItem[] {
  return items.map((rawItem, index) => {
    if (!isRecord(rawItem)) {
      return {
        name: `Pozycja ${index + 1}`,
        quantity: 1,
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

    return {
      name:
        readString(rawItem, ["name", "label", "title"]) ??
        `Pozycja ${index + 1}`,
      quantity,
      totalGross:
        explicitTotalGross ??
        (unitPriceGross !== null
          ? roundMoney(unitPriceGross * quantity)
          : null),
    };
  });
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

function createDocumentNumber(lead: StoredCalculatorInquiryLead): string {
  const date = new Date(lead.receivedAt);
  const year = Number.isNaN(date.getTime())
    ? new Date().getFullYear()
    : date.getFullYear();

  const shortId = lead.id
    .replace(/^inq_/i, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `MG-${year}-${shortId || "QUOTE"}`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(date);
}

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;
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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
