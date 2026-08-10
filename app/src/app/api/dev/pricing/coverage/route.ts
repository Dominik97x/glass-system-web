import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_CONFIGURATION,
  type Length,
  type ProductConfiguration,
  type Width,
} from "@/domain/ProductConfiguration";
import type { Quote } from "@/domain/Quote";
import { QuoteService } from "@/pricing/services/QuoteService";

export const runtime = "nodejs";

const WIDTH_OPTIONS: Width[] = [
  306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206,
];

const LENGTH_OPTIONS: Length[] = [300, 350, 400, 450, 500, 550, 600];

interface PricingCoverageScenario {
  id: string;
  label: string;
  expectedCategories: string[];
  createConfiguration(width: Width, length: Length): ProductConfiguration;
}

interface PricingCoverageProblem {
  scenarioId: string;
  scenarioLabel: string;
  width: Width;
  length: Length;
  dimensionLabel: string;
  message: string;
  details?: unknown;
}

interface PricingCoverageRecord {
  scenarioId: string;
  scenarioLabel: string;
  width: Width;
  length: Length;
  dimensionLabel: string;
  totalGross: number;
  itemCount: number;
  categories: string[];
  items: {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unitPriceGross: number;
    totalPriceGross: number;
  }[];
}

const scenarios: PricingCoverageScenario[] = [
  {
    id: "terrace_roof_base",
    label: "Zadaszenie tarasu - baza",
    expectedCategories: ["construction", "installation"],
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width,
      length,
      walls: "none",
      roof: "polycarbonate_clear",
      hasFrontZip: false,
      hasLeftZip: false,
      hasRightZip: false,
      hasAwning: false,
      hasLed: false,
      hasCob: false,
      hasHandles: false,
      hasBrushes: false,
      hasLevelingProfile: false,
    }),
  },
  {
    id: "terrace_roof_options",
    label: "Zadaszenie tarasu - ZIP, markiza, LED punktowe i dodatki",
    expectedCategories: [
      "construction",
      "installation",
      "zip",
      "awning",
      "lighting",
      "accessory",
    ],
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width,
      length,
      walls: "none",
      roof: "polycarbonate_clear",
      hasFrontZip: true,
      hasLeftZip: false,
      hasRightZip: false,
      hasAwning: true,
      hasLed: true,
      hasCob: false,
      hasHandles: true,
      hasBrushes: true,
      hasLevelingProfile: true,
    }),
  },
  {
    id: "terrace_roof_poly_color",
    label: "Zadaszenie tarasu - doplata do poliw?glanu kolorowego",
    expectedCategories: ["construction", "installation", "roof"],
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width,
      length,
      walls: "none",
      roof: "polycarbonate_grey",
      hasFrontZip: false,
      hasLeftZip: false,
      hasRightZip: false,
      hasAwning: false,
      hasLed: false,
      hasCob: false,
      hasHandles: false,
      hasBrushes: false,
      hasLevelingProfile: false,
    }),
  },
  {
    id: "terrace_roof_rgb_cct",
    label: "Zadaszenie tarasu - LED RGB CCT",
    expectedCategories: ["construction", "installation", "lighting"],
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      productType: "terrace_roof",
      width,
      length,
      walls: "none",
      roof: "polycarbonate_clear",
      hasFrontZip: false,
      hasLeftZip: false,
      hasRightZip: false,
      hasAwning: false,
      hasLed: false,
      hasCob: true,
      hasHandles: false,
      hasBrushes: false,
      hasLevelingProfile: false,
    }),
  },
  {
    id: "winter_garden_base",
    label: "Ogrod zimowy - baza",
    expectedCategories: ["construction", "installation"],
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width,
      length,
      walls: "glass_clear",
      roof: "polycarbonate_clear",
      hasFrontZip: false,
      hasLeftZip: false,
      hasRightZip: false,
      hasAwning: false,
      hasLed: false,
      hasCob: false,
      hasHandles: false,
      hasBrushes: false,
      hasLevelingProfile: false,
    }),
  },
  {
    id: "winter_garden_tinted_glass",
    label: "Ogrod zimowy - szklo dachowe i sciany przyciemniane",
    expectedCategories: [
      "construction",
      "installation",
      "roof",
      "walls",
    ],
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width,
      length,
      walls: "glass_tinted",
      roof: "glass_tinted",
      hasFrontZip: false,
      hasLeftZip: false,
      hasRightZip: false,
      hasAwning: false,
      hasLed: false,
      hasCob: false,
      hasHandles: false,
      hasBrushes: false,
      hasLevelingProfile: false,
    }),
  },
  {
    id: "winter_garden_full",
    label: "Ogrod zimowy - trzy ZIP, markiza, LED punktowe i dodatki",
    expectedCategories: [
      "construction",
      "installation",
      "zip",
      "awning",
      "lighting",
      "accessory",
    ],
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      productType: "winter_garden",
      width,
      length,
      walls: "glass_clear",
      roof: "polycarbonate_clear",
      hasFrontZip: true,
      hasLeftZip: true,
      hasRightZip: true,
      hasAwning: true,
      hasLed: true,
      hasCob: false,
      hasHandles: true,
      hasBrushes: true,
      hasLevelingProfile: true,
    }),
  },
]

const quoteService = new QuoteService();

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "Pricing coverage endpoint is disabled in production.",
      },
      { status: 404 }
    );
  }

  const mode = request.nextUrl.searchParams.get("mode") ?? "summary";

  const records: PricingCoverageRecord[] = [];
  const problems: PricingCoverageProblem[] = [];
  let expectedIndividualQuoteChecks = 0;

  for (const scenario of scenarios) {
    for (const width of WIDTH_OPTIONS) {
      for (const length of LENGTH_OPTIONS) {
        const configuration = scenario.createConfiguration(width, length);

        try {
          const quote = quoteService.createQuote(configuration);
          const record = createCoverageRecord(
            scenario,
            configuration,
            quote
          );

          records.push(record);

          problems.push(
            ...findRecordProblems(scenario, configuration, quote, record)
          );
        } catch (error) {
          if (
            isExpectedIndividualQuote(
              scenario,
              configuration,
              error
            )
          ) {
            expectedIndividualQuoteChecks += 1;
            continue;
          }

          problems.push({
            scenarioId: scenario.id,
            scenarioLabel: scenario.label,
            width,
            length,
            dimensionLabel: `${length} x ${width} cm`,
            message: "Pricing Engine threw an error for this configuration.",
            details:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                  }
                : error,
          });
        }
      }
    }
  }

  const response = createCoverageResponse(
    records,
    problems,
    expectedIndividualQuoteChecks
  );

  if (mode === "full") {
    return NextResponse.json(response);
  }

  return NextResponse.json({
    success: response.success,
    source: response.source,
    pricingFlow: response.pricingFlow,
    summary: response.summary,
    conclusions: response.conclusions,
    problemGroups: response.problemGroups,
    successfulDimensions: response.successfulDimensions,
    recommendedNextSteps: response.recommendedNextSteps,
    usefulUrls: {
      summary: "/api/dev/pricing/coverage",
      full: "/api/dev/pricing/coverage?mode=full",
    },
  });
}

function isExpectedIndividualQuote(
  scenario: PricingCoverageScenario,
  configuration: ProductConfiguration,
  error: unknown
): boolean {
  return (
    scenario.id === "winter_garden_tinted_glass" &&
    configuration.length >= 550 &&
    configuration.roof.startsWith("glass_") &&
    error instanceof Error &&
    error.message.includes("550 i 600 cm")
  );
}

function createCoverageResponse(
  records: PricingCoverageRecord[],
  problems: PricingCoverageProblem[],
  expectedIndividualQuoteChecks: number
) {
  const totals = records.map((record) => record.totalGross);
  const categorySet = new Set<string>();

  for (const record of records) {
    for (const category of record.categories) {
      categorySet.add(category);
    }
  }

  const recordsWithZeroTotal = records.filter(
    (record) => record.totalGross <= 0
  );

  const recordsWithNoItems = records.filter(
    (record) => record.itemCount === 0
  );

  return {
    success: problems.length === 0,
    source: "current-quote-service-complete-catalog-model",
    pricingFlow: [
      "QuoteService",
      "SnapshotQuoteService",
      "CrmCoreCatalog",
      "crm-core-products.generated.json",
      "published-pricing.generated.json",
    ],
    summary: {
      widths: WIDTH_OPTIONS.length,
      lengths: LENGTH_OPTIONS.length,
      dimensions: WIDTH_OPTIONS.length * LENGTH_OPTIONS.length,
      scenarios: scenarios.length,
      expectedQuoteChecks:
        WIDTH_OPTIONS.length * LENGTH_OPTIONS.length * scenarios.length,
      successfulQuoteChecks:
        records.length + expectedIndividualQuoteChecks,
      pricedQuoteChecks: records.length,
      expectedIndividualQuoteChecks,
      failedQuoteChecks:
        WIDTH_OPTIONS.length * LENGTH_OPTIONS.length * scenarios.length -
        records.length -
        expectedIndividualQuoteChecks,
      problems: problems.length,
      recordsWithZeroTotal: recordsWithZeroTotal.length,
      recordsWithNoItems: recordsWithNoItems.length,
      minTotalGross: totals.length > 0 ? Math.min(...totals) : null,
      maxTotalGross: totals.length > 0 ? Math.max(...totals) : null,
      categories: Array.from(categorySet).sort(),
    },
    conclusions: createConclusions(records, problems),
    problemGroups: groupProblems(problems),
    successfulDimensions: getSuccessfulDimensions(records),
    recommendedNextSteps: [
      "Utrzymywac QuoteService jako kanoniczny punkt wejscia do wyceny kalkulatora.",
      "Produkty kompletne i montaz pobierac z katalogu D4.2.",
      "Dodatki nadal pobierac z opublikowanego snapshotu cenowego.",
      "Wyceny indywidualne traktowac jako poprawny wynik biznesowy, a nie blad coverage.",
    ],
    notes: [
      "Endpoint sprawdza aktualny tor produkcyjny kalkulatora przez QuoteService.",
      "successfulQuoteChecks obejmuje wyceny automatyczne oraz oczekiwane wyceny indywidualne.",
      "pricedQuoteChecks oznacza konfiguracje, dla ktorych kalkulator zwrocil cene.",
      "expectedIndividualQuoteChecks oznacza konfiguracje celowo przekazane do wyceny indywidualnej.",
    ],
    scenarios: scenarios.map((scenario) => ({
      id: scenario.id,
      label: scenario.label,
      expectedCategories: scenario.expectedCategories,
    })),
    problems,
    samples: {
      firstRecords: records.slice(0, 8),
      highestQuotes: records
        .toSorted((a, b) => b.totalGross - a.totalGross)
        .slice(0, 8),
      lowestQuotes: records
        .toSorted((a, b) => a.totalGross - b.totalGross)
        .slice(0, 8),
    },
  };
}

function createConclusions(
  records: PricingCoverageRecord[],
  problems: PricingCoverageProblem[]
): string[] {
  if (problems.length === 0) {
    return [
      "Obecny TypeScript Pricing Engine ma pełne pokrycie dla sprawdzanych scenariuszy.",
    ];
  }

  return [
    `Obecny TypeScript Pricing Engine nie ma pełnego pokrycia cen: ${problems.length} problemów.`,
    `Silnik poprawnie policzył tylko ${records.length} konfiguracji spośród ${
      WIDTH_OPTIONS.length * LENGTH_OPTIONS.length * scenarios.length
    } sprawdzonych przypadków.`,
    "Najczęstszy problem to brak ceny konstrukcji dla wielu wymiarów.",
    "To potwierdza, że docelowym źródłem powinien być Excel/snapshot, a nie ręczne pliki TypeScript.",
  ];
}

function groupProblems(problems: PricingCoverageProblem[]) {
  const groups = new Map<
    string,
    {
      message: string;
      count: number;
      examples: PricingCoverageProblem[];
    }
  >();

  for (const problem of problems) {
    const existingGroup = groups.get(problem.message);

    if (existingGroup) {
      existingGroup.count += 1;

      if (existingGroup.examples.length < 8) {
        existingGroup.examples.push(problem);
      }
    } else {
      groups.set(problem.message, {
        message: problem.message,
        count: 1,
        examples: [problem],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

function getSuccessfulDimensions(records: PricingCoverageRecord[]) {
  const dimensions = new Map<
    string,
    {
      dimensionLabel: string;
      width: Width;
      length: Length;
      scenarios: string[];
      totals: number[];
    }
  >();

  for (const record of records) {
    const key = `${record.length}x${record.width}`;
    const existingDimension = dimensions.get(key);

    if (existingDimension) {
      existingDimension.scenarios.push(record.scenarioId);
      existingDimension.totals.push(record.totalGross);
    } else {
      dimensions.set(key, {
        dimensionLabel: record.dimensionLabel,
        width: record.width,
        length: record.length,
        scenarios: [record.scenarioId],
        totals: [record.totalGross],
      });
    }
  }

  return Array.from(dimensions.values()).sort((a, b) => {
    if (a.length !== b.length) {
      return a.length - b.length;
    }

    return a.width - b.width;
  });
}

function createCoverageRecord(
  scenario: PricingCoverageScenario,
  configuration: ProductConfiguration,
  quote: Quote
): PricingCoverageRecord {
  return {
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    width: configuration.width,
    length: configuration.length,
    dimensionLabel: `${configuration.length} x ${configuration.width} cm`,
    totalGross: quote.totalGross,
    itemCount: quote.items.length,
    categories: quote.items.map((item) => item.category),
    items: quote.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unitPriceGross: item.unitPriceGross,
      totalPriceGross: item.totalPriceGross,
    })),
  };
}

function findRecordProblems(
  scenario: PricingCoverageScenario,
  configuration: ProductConfiguration,
  quote: Quote,
  record: PricingCoverageRecord
): PricingCoverageProblem[] {
  const problems: PricingCoverageProblem[] = [];

  if (quote.items.length === 0) {
    problems.push({
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      width: configuration.width,
      length: configuration.length,
      dimensionLabel: record.dimensionLabel,
      message: "Quote has no items.",
    });
  }

  if (quote.totalGross <= 0) {
    problems.push({
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      width: configuration.width,
      length: configuration.length,
      dimensionLabel: record.dimensionLabel,
      message: "Quote totalGross is zero or negative.",
      details: {
        totalGross: quote.totalGross,
      },
    });
  }

  const sumOfItems = quote.items.reduce(
    (sum, item) => sum + item.totalPriceGross,
    0
  );

  if (sumOfItems !== quote.totalGross) {
    problems.push({
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      width: configuration.width,
      length: configuration.length,
      dimensionLabel: record.dimensionLabel,
      message: "Quote totalGross does not equal sum of item totals.",
      details: {
        totalGross: quote.totalGross,
        sumOfItems,
      },
    });
  }

  const categories = new Set(record.categories);

  for (const expectedCategory of scenario.expectedCategories) {
    if (!categories.has(expectedCategory)) {
      problems.push({
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        width: configuration.width,
        length: configuration.length,
        dimensionLabel: record.dimensionLabel,
        message: `Expected category is missing: ${expectedCategory}.`,
        details: {
          expectedCategory,
          actualCategories: record.categories,
        },
      });
    }
  }

  return problems;
}