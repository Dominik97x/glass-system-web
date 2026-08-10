import { NextResponse } from "next/server";

import {
  DEFAULT_CONFIGURATION,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import { QuoteService } from "@/pricing/services/QuoteService";

export const runtime = "nodejs";

const quoteService = new QuoteService();

interface TestCase {
  id: string;
  name: string;
  expectedTotalGross: number;
  configuration: ProductConfiguration;
}

const testCases: TestCase[] = [
  {
    id: "T1",
    name: "300 x 606 cm — samo zadaszenie poliwęglan",
    expectedTotalGross: 13246,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width: 606,
      length: 300,
    },
  },
  {
    id: "T2",
    name: "300 x 606 cm — zadaszenie i ściany przezroczyste",
    expectedTotalGross: 31298,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width: 606,
      length: 300,
      walls: "glass_clear",
    },
  },
  {
    id: "T3",
    name: "300 x 606 cm — ściany przyciemniane",
    expectedTotalGross: 33132,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width: 606,
      length: 300,
      walls: "glass_tinted",
    },
  },
  {
    id: "T4",
    name: "450 x 506 cm — ściany przezroczyste, ZIP prawy, markiza i LED punktowe",
    expectedTotalGross: 53361,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width: 506,
      length: 450,
      walls: "glass_clear",
      hasRightZip: true,
      hasAwning: true,
      hasLed: true,
    },
  },
  {
    id: "T5",
    name: "500 x 806 cm — duża konfiguracja z dodatkami",
    expectedTotalGross: 89278,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width: 806,
      length: 500,
      walls: "glass_tinted",
      roof: "polycarbonate_milky",
      hasRightZip: true,
      hasFrontZip: true,
      hasAwning: true,
      hasLed: true,
      hasLevelingProfile: true,
      hasBrushes: true,
      hasHandles: true,
    },
  },
  {
    id: "T6",
    name: "550 x 606 cm — zadaszenie poliwęglan",
    expectedTotalGross: 30249,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width: 606,
      length: 550,
    },
  },
  {
    id: "T7",
    name: "600 x 806 cm — ogród zimowy poliwęglan",
    expectedTotalGross: 69966,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width: 806,
      length: 600,
      walls: "glass_clear",
    },
  },
  {
    id: "T8",
    name: "450 x 606 cm — LED RGB CCT",
    expectedTotalGross: 24759,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width: 606,
      length: 450,
      hasCob: true,
    },
  },
  {
    id: "T9",
    name: "500 x 606 cm — LED RGB CCT i markiza",
    expectedTotalGross: 36662,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width: 606,
      length: 500,
      hasCob: true,
      hasAwning: true,
    },
  },
  {
    id: "T10",
    name: "600 x 806 cm — maksimum bez szkła dachowego — LED RGB CCT",
    expectedTotalGross: 109705,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width: 806,
      length: 600,
      walls: "glass_tinted",
      roof: "polycarbonate_milky",
      hasRightZip: true,
      hasFrontZip: true,
      hasAwning: true,
      hasCob: true,
      hasLevelingProfile: true,
      hasBrushes: true,
      hasHandles: true,
    },
  },
  {
    id: "T11",
    name: "300 x 306 cm — zadaszenie z przednim ZIP-em bez ścian",
    expectedTotalGross: 10738,
    configuration: {
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width: 306,
      length: 300,
      walls: "none",
      hasFrontZip: true,
    },
  },
];

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "Quote check endpoint is disabled in production.",
      },
      { status: 404 }
    );
  }

  const cases = testCases.map((testCase) => {
    const quote = quoteService.createQuote(testCase.configuration);
    const passed = quote.totalGross === testCase.expectedTotalGross;

    return {
      id: testCase.id,
      name: testCase.name,
      expectedTotalGross: testCase.expectedTotalGross,
      actualTotalGross: quote.totalGross,
      difference: quote.totalGross - testCase.expectedTotalGross,
      passed,
      configuration: testCase.configuration,
      items: quote.items,
    };
  });

  return NextResponse.json({
    success: cases.every((testCase) => testCase.passed),
    passed: cases.filter((testCase) => testCase.passed).length,
    failed: cases.filter((testCase) => !testCase.passed).length,
    cases,
  });
}
