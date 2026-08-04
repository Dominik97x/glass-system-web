import { NextRequest, NextResponse } from "next/server";

import generatedPricingSnapshot from "@/data/pricing/glass-system/published-pricing.generated.json";
import {
  DEFAULT_CONFIGURATION,
  getProductKind,
  type Length,
  type ProductConfiguration,
  type Width,
} from "@/domain/ProductConfiguration";
import type { PricingSnapshot } from "@/pricing/snapshots/PricingSnapshot";
import {
  StaticPublishedPricingSnapshotRepository,
} from "@/pricing/snapshots/PublishedPricingSnapshotRepository";
import { PricingSnapshotConfigurationPriceCalculator } from "@/pricing/snapshots/PricingSnapshotConfigurationPriceCalculator";
import { PricingSnapshotPriceReader } from "@/pricing/snapshots/PricingSnapshotPriceReader";
import { validatePricingSnapshot } from "@/pricing/snapshots/PricingSnapshotValidator";

export const runtime = "nodejs";

const WIDTH_OPTIONS: Width[] = [
  306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206,
];

const LENGTH_OPTIONS: Length[] = [300, 350, 400, 450, 500, 550, 600];

interface SnapshotCoverageScenario {
  id: string;
  label: string;
  createConfiguration(width: Width, length: Length): ProductConfiguration;
}

interface SnapshotCoverageProblem {
  scenarioId: string;
  scenarioLabel: string;
  width: Width;
  length: Length;
  dimensionLabel: string;
  productType: string;
  message: string;
  details?: unknown;
}

interface SnapshotCoverageRecord {
  scenarioId: string;
  scenarioLabel: string;
  width: Width;
  length: Length;
  dimensionLabel: string;
  productType: string;
  totalGross: number;
  fields: string[];
}

const scenarios: SnapshotCoverageScenario[] = [
  {
    id: "terrace_roof_base",
    label: "Zadaszenie tarasu - konfiguracja bazowa",
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
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
    id: "terrace_roof_with_options",
    label: "Zadaszenie tarasu - dodatki bez ścian",
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      width,
      length,
      walls: "none",
      roof: "polycarbonate_clear",
      hasFrontZip: false,
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
    id: "winter_garden_base",
    label: "Ogród zimowy - konfiguracja bazowa",
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
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
    id: "winter_garden_full",
    label: "Ogród zimowy - konfiguracja z dodatkami",
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
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
  {
    id: "terrace_roof_cct",
    label: "Zadaszenie tarasu - LED CCT i ZIP bez ścian",
    createConfiguration: (width, length) => ({
      ...DEFAULT_CONFIGURATION,
      width,
      length,
      walls: "none",
      roof: "polycarbonate_clear",
      hasFrontZip: false,
      hasLeftZip: false,
      hasRightZip: true,
      hasAwning: false,
      hasLed: false,
      hasCob: true,
      hasHandles: false,
      hasBrushes: false,
      hasLevelingProfile: false,
    }),
  },
];

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "Snapshot pricing coverage endpoint is disabled in production.",
      },
      { status: 404 }
    );
  }

  const mode = request.nextUrl.searchParams.get("mode") ?? "summary";

  const repository = new StaticPublishedPricingSnapshotRepository(
    generatedPricingSnapshot as PricingSnapshot
  );

  const snapshot = await repository.getPublishedSnapshot();
  const validation = validatePricingSnapshot(snapshot);
  const reader = new PricingSnapshotPriceReader(snapshot);
  const calculator = new PricingSnapshotConfigurationPriceCalculator(reader);

  const records: SnapshotCoverageRecord[] = [];
  const problems: SnapshotCoverageProblem[] = [];

  for (const scenario of scenarios) {
    for (const width of WIDTH_OPTIONS) {
      for (const length of LENGTH_OPTIONS) {
        const configuration = scenario.createConfiguration(width, length);
        const productType = getProductKind(configuration);
        const dimensionLabel = `${length} x ${width} cm`;

        const hasPriceMatrixRow = reader.hasActivePriceMatrixRow({
          productType,
          widthCm: width,
          lengthCm: length,
        });

        if (!hasPriceMatrixRow) {
          problems.push({
            scenarioId: scenario.id,
            scenarioLabel: scenario.label,
            width,
            length,
            dimensionLabel,
            productType,
            message: "Snapshot active price matrix row is missing.",
            details: {
              productType,
              widthCm: width,
              lengthCm: length,
            },
          });

          continue;
        }

        try {
          const calculation = calculator.calculate(configuration);

          records.push({
            scenarioId: scenario.id,
            scenarioLabel: scenario.label,
            width,
            length,
            dimensionLabel,
            productType,
            totalGross: calculation.totalGross,
            fields: calculation.fields,
          });

          if (calculation.totalGross <= 0) {
            problems.push({
              scenarioId: scenario.id,
              scenarioLabel: scenario.label,
              width,
              length,
              dimensionLabel,
              productType,
              message: "Snapshot calculation totalGross is zero or negative.",
              details: {
                totalGross: calculation.totalGross,
                fields: calculation.fields,
              },
            });
          }
        } catch (error) {
          problems.push({
            scenarioId: scenario.id,
            scenarioLabel: scenario.label,
            width,
            length,
            dimensionLabel,
            productType,
            message: "Snapshot calculator threw an error for this configuration.",
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

  const response = createSnapshotCoverageResponse({
    records,
    problems,
    validation,
    activeDimensionKeys: reader.getActiveDimensionKeys(),
  });

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
      summary: "/api/dev/pricing/snapshot-coverage",
      full: "/api/dev/pricing/snapshot-coverage?mode=full",
      currentTypeScriptPricing: "/api/dev/pricing/coverage",
      snapshotValidation: "/api/dev/pricing-snapshot/validate",
    },
  });
}

function createSnapshotCoverageResponse({
  records,
  problems,
  validation,
  activeDimensionKeys,
}: {
  records: SnapshotCoverageRecord[];
  problems: SnapshotCoverageProblem[];
  validation: ReturnType<typeof validatePricingSnapshot>;
  activeDimensionKeys: string[];
}) {
  const totals = records.map((record) => record.totalGross);

  return {
    success: problems.length === 0 && validation.success,
    source: "published-pricing-snapshot-generated-from-workbook",
    pricingFlow: [
      "StaticPublishedPricingSnapshotRepository",
      "PricingSnapshotPriceReader",
      "PricingSnapshotConfigurationPriceCalculator",
      "published-pricing.generated.json",
    ],
    summary: {
      widths: WIDTH_OPTIONS.length,
      lengths: LENGTH_OPTIONS.length,
      dimensions: WIDTH_OPTIONS.length * LENGTH_OPTIONS.length,
      scenarios: scenarios.length,
      expectedQuoteChecks:
        WIDTH_OPTIONS.length * LENGTH_OPTIONS.length * scenarios.length,
      successfulQuoteChecks: records.length,
      failedQuoteChecks:
        WIDTH_OPTIONS.length * LENGTH_OPTIONS.length * scenarios.length -
        records.length,
      problems: problems.length,
      activeSnapshotDimensionKeys: activeDimensionKeys.length,
      validationErrors: validation.errors.length,
      validationWarnings: validation.warnings.length,
      minTotalGross: totals.length > 0 ? Math.min(...totals) : null,
      maxTotalGross: totals.length > 0 ? Math.max(...totals) : null,
    },
    conclusions: createConclusions(records, problems, activeDimensionKeys),
    problemGroups: groupProblems(problems),
    successfulDimensions: getSuccessfulDimensions(records),
    recommendedNextSteps: [
      "Snapshot wygenerowany z workbooka ma być teraz głównym kandydatem na docelowe źródło cen.",
      "Jeżeli problems = 0, snapshot ma pełne pokrycie aktywnych scenariuszy.",
      "Przed przepięciem kalkulatora warto porównać kilka cen z Excelem i obecnym UI.",
      "Przed integracją Bitrix uzupełnić bitrixProductId albo świadomie zostawić productName-only dla pierwszych testów.",
      "Ujednolicić kategorię ścian: docelowo używać 'walls' zamiast starego 'wall'.",
    ],
    notes: [
      "Ten endpoint sprawdza published pricing snapshot wygenerowany z workbooka Glass System.",
      "Braki w bitrixProductId mogą powodować validationWarnings, ale nie powinny blokować samego liczenia cen.",
      "Najważniejsze pola dla tego etapu to successfulQuoteChecks, failedQuoteChecks, problems i activeSnapshotDimensionKeys.",
    ],
    validation: {
      success: validation.success,
      errors: validation.errors,
      warnings: validation.warnings,
    },
    scenarios: scenarios.map((scenario) => ({
      id: scenario.id,
      label: scenario.label,
    })),
    records,
    problems,
    samples: {
      firstRecords: records.slice(0, 8),
      highestQuotes: [...records]
        .sort((a, b) => b.totalGross - a.totalGross)
        .slice(0, 8),
      lowestQuotes: [...records]
        .sort((a, b) => a.totalGross - b.totalGross)
        .slice(0, 8),
    },
  };
}

function createConclusions(
  records: SnapshotCoverageRecord[],
  problems: SnapshotCoverageProblem[],
  activeDimensionKeys: string[]
): string[] {
  if (problems.length === 0) {
    return [
      `Snapshot ma ${activeDimensionKeys.length} aktywnych kluczy wymiarów.`,
      `Snapshot poprawnie policzył ${records.length} konfiguracji spośród ${
        WIDTH_OPTIONS.length * LENGTH_OPTIONS.length * scenarios.length
      } sprawdzonych przypadków.`,
      "Published pricing snapshot wygenerowany z workbooka ma pełne pokrycie dla sprawdzanych scenariuszy.",
    ];
  }

  return [
    `Snapshot ma obecnie ${activeDimensionKeys.length} aktywnych kluczy wymiarów.`,
    `Snapshot poprawnie policzył ${records.length} konfiguracji spośród ${
      WIDTH_OPTIONS.length * LENGTH_OPTIONS.length * scenarios.length
    } sprawdzonych przypadków.`,
    `Liczba problemów: ${problems.length}.`,
    "Najczęstszy problem powinien wynikać z brakujących active priceMatrix rows albo pustych cen.",
    "Jeżeli problemów jest dużo, trzeba wrócić do workbooka i sprawdzić arkusz app_price_matrix.",
  ];
}

function groupProblems(problems: SnapshotCoverageProblem[]) {
  const groups = new Map<
    string,
    {
      message: string;
      count: number;
      examples: SnapshotCoverageProblem[];
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

function getSuccessfulDimensions(records: SnapshotCoverageRecord[]) {
  const dimensions = new Map<
    string,
    {
      dimensionLabel: string;
      width: Width;
      length: Length;
      productTypes: string[];
      scenarios: string[];
      totals: number[];
    }
  >();

  for (const record of records) {
    const key = `${record.productType}:${record.length}x${record.width}`;
    const existingDimension = dimensions.get(key);

    if (existingDimension) {
      if (!existingDimension.productTypes.includes(record.productType)) {
        existingDimension.productTypes.push(record.productType);
      }

      existingDimension.scenarios.push(record.scenarioId);
      existingDimension.totals.push(record.totalGross);
    } else {
      dimensions.set(key, {
        dimensionLabel: record.dimensionLabel,
        width: record.width,
        length: record.length,
        productTypes: [record.productType],
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