import { NextRequest, NextResponse } from "next/server";

import type {
  Length,
  ProductKind,
  Width,
} from "@/domain/ProductConfiguration";

export const runtime = "nodejs";

const PRODUCT_TYPES: ProductKind[] = ["terrace_roof", "winter_garden"];

const WIDTH_OPTIONS: Width[] = [
  306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206,
];

const LENGTH_OPTIONS: Length[] = [300, 350, 400, 450, 500];

interface PriceMatrixTemplateRow {
  productType: ProductKind;
  lengthCm: Length;
  widthCm: Width;
  dimensionLabel: string;
  active: true;

  constructionGross: number;

  roofPolycarbonateClearGross: number;
  roofPolycarbonateMilkyGross: number;
  roofPolycarbonateGreyGross: number;
  roofPolycarbonateSmokeGross: number;
  roofGlassClearGross: number;
  roofGlassMilkyGross: number;
  roofGlassTintedGross: number;

  wallGlassClearGross: number;
  wallGlassMilkyGross: number;
  wallGlassTintedGross: number;

  zipRightGross: number;
  zipLeftGross: number;
  zipFrontGross: number;

  awningGross: number;
  levelingProfileGross: number;

  ledSpotGross: number;
  ledStripGross: number;
  ledCobGross: number;

  handlesGross: number;
  brushesGross: number;
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "Price matrix template endpoint is disabled in production.",
      },
      { status: 404 }
    );
  }

  const format = request.nextUrl.searchParams.get("format") ?? "summary";
  const rows = createPriceMatrixTemplateRows();

  if (format === "csv") {
    return new NextResponse(createCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="glass-system-price-matrix-template.csv"',
      },
    });
  }

  if (format === "json") {
    return NextResponse.json({
      success: true,
      source: "generated-price-matrix-template",
      summary: createSummary(rows),
      columns: getColumns(rows),
      notes: createNotes(),
      rows,
    });
  }

  return NextResponse.json({
    success: true,
    source: "generated-price-matrix-template",
    summary: createSummary(rows),
    columns: getColumns(rows),
    notes: createNotes(),
    usefulUrls: {
      summary: "/api/dev/pricing/price-matrix-template",
      json: "/api/dev/pricing/price-matrix-template?format=json",
      csv: "/api/dev/pricing/price-matrix-template?format=csv",
    },
  });
}

function createSummary(rows: PriceMatrixTemplateRow[]) {
  return {
    productTypes: PRODUCT_TYPES.length,
    widths: WIDTH_OPTIONS.length,
    lengths: LENGTH_OPTIONS.length,
    rows: rows.length,
    expectedRows:
      PRODUCT_TYPES.length * WIDTH_OPTIONS.length * LENGTH_OPTIONS.length,
  };
}

function createNotes(): string[] {
  return [
    "Ten endpoint generuje szkielet app_price_matrix do uzupełnienia w Excelu.",
    "Wartości cenowe są ustawione na 0 i wymagają uzupełnienia.",
    "Dla każdego wymiaru generujemy osobny wiersz dla terrace_roof i winter_garden.",
    "CSV używa separatora średnikowego, żeby łatwiej otwierał się w polskim Excelu.",
    "Po uzupełnieniu cen dane powinny trafić do published pricing snapshot.",
  ];
}

function getColumns(rows: PriceMatrixTemplateRow[]): string[] {
  return Object.keys(rows[0] ?? {});
}

function createPriceMatrixTemplateRows(): PriceMatrixTemplateRow[] {
  const rows: PriceMatrixTemplateRow[] = [];

  for (const productType of PRODUCT_TYPES) {
    for (const lengthCm of LENGTH_OPTIONS) {
      for (const widthCm of WIDTH_OPTIONS) {
        rows.push(createEmptyPriceMatrixRow(productType, lengthCm, widthCm));
      }
    }
  }

  return rows;
}

function createEmptyPriceMatrixRow(
  productType: ProductKind,
  lengthCm: Length,
  widthCm: Width
): PriceMatrixTemplateRow {
  return {
    productType,
    lengthCm,
    widthCm,
    dimensionLabel: `${lengthCm} x ${widthCm} cm`,
    active: true,

    constructionGross: 0,

    roofPolycarbonateClearGross: 0,
    roofPolycarbonateMilkyGross: 0,
    roofPolycarbonateGreyGross: 0,
    roofPolycarbonateSmokeGross: 0,
    roofGlassClearGross: 0,
    roofGlassMilkyGross: 0,
    roofGlassTintedGross: 0,

    wallGlassClearGross: 0,
    wallGlassMilkyGross: 0,
    wallGlassTintedGross: 0,

    zipRightGross: 0,
    zipLeftGross: 0,
    zipFrontGross: 0,

    awningGross: 0,
    levelingProfileGross: 0,

    ledSpotGross: 0,
    ledStripGross: 0,
    ledCobGross: 0,

    handlesGross: 0,
    brushesGross: 0,
  };
}

function createCsv(rows: PriceMatrixTemplateRow[]): string {
  const headers = getColumns(rows) as (keyof PriceMatrixTemplateRow)[];

  const headerLine = headers.join(";");

  const lines = rows.map((row) =>
    headers.map((header) => formatCsvValue(row[header])).join(";")
  );

  return `\uFEFF${[headerLine, ...lines].join("\n")}`;
}

function formatCsvValue(value: string | number | boolean): string {
  const stringValue = String(value);

  if (
    stringValue.includes(";") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}