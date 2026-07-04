import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";

const WIDTHS = [306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206];
const LENGTHS = [300, 350, 400, 450, 500];

const WALL_OPTIONS = ["none", "glass_clear", "glass_milky", "glass_tinted"];
const ROOF_OPTIONS = [
  "polycarbonate_clear",
  "polycarbonate_milky",
  "polycarbonate_grey",
  "polycarbonate_smoke",
  "glass_clear",
  "glass_milky",
];

interface QuoteSnapshotWithConfiguration {
  configuration?: unknown;
}

export function readProductConfigurationFromInquiry(
  inquiry: StoredCalculatorInquiryLead
): ProductConfiguration | null {
  const quote = inquiry.quote as QuoteSnapshotWithConfiguration;
  const candidate = quote.configuration;

  if (!isProductConfiguration(candidate)) {
    return null;
  }

  return candidate;
}

function isProductConfiguration(value: unknown): value is ProductConfiguration {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isKnownNumber(value.width, WIDTHS) &&
    isKnownNumber(value.length, LENGTHS) &&
    isKnownString(value.walls, WALL_OPTIONS) &&
    isKnownString(value.roof, ROOF_OPTIONS) &&
    typeof value.hasFrontZip === "boolean" &&
    typeof value.hasLeftZip === "boolean" &&
    typeof value.hasRightZip === "boolean" &&
    typeof value.hasAwning === "boolean" &&
    typeof value.hasLed === "boolean" &&
    typeof value.hasCob === "boolean" &&
    typeof value.hasHandles === "boolean" &&
    typeof value.hasBrushes === "boolean" &&
    typeof value.hasLevelingProfile === "boolean"
  );
}

function isKnownNumber(value: unknown, allowedValues: number[]): boolean {
  return typeof value === "number" && allowedValues.includes(value);
}

function isKnownString(value: unknown, allowedValues: string[]): boolean {
  return typeof value === "string" && allowedValues.includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}