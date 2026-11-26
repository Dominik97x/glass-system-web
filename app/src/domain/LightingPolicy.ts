import type { ProductConfiguration } from "./ProductConfiguration";
import policy from "./lighting-auto-quote-policy.json";

export type LightingKind = "point" | "cct" | "rgb_cct";

// Supplier price coverage reviewed 2026-11-25. This is a commercial
// allowlist for automatic quotes, not an inventory or delivery guarantee.
const depths: Record<LightingKind, readonly number[]> = policy.depths;
const widths: readonly number[] = policy.widths;

export function isLightingAvailable(kind: LightingKind, length: number, width: number): boolean {
  return depths[kind].includes(length) && widths.includes(width);
}

export function getLightingSelectionError(configuration: ProductConfiguration): string | null {
  if (configuration.hasRgbCct !== undefined && typeof configuration.hasRgbCct !== "boolean") {
    return "Nieprawidłowa wartość konfiguracji: hasRgbCct.";
  }
  const selected: LightingKind[] = [];
  if (configuration.hasLed) selected.push("point");
  if (configuration.hasCob) selected.push("cct");
  if (configuration.hasRgbCct) selected.push("rgb_cct");
  if (selected.length > 1) return "Rodzaje oświetlenia LED nie mogą być wybrane jednocześnie.";
  const kind = selected[0];
  if (kind && !isLightingAvailable(kind, configuration.length, configuration.width)) {
    const label = kind === "rgb_cct" ? "LED RGB CCT" : kind === "cct" ? "LED CCT" : "LED punktowe";
    return `${label} dla wymiaru ${configuration.length}×${configuration.width} cm wymaga wyceny indywidualnej.`;
  }
  return null;
}

export function assertLightingPriceable(configuration: ProductConfiguration): void {
  const error = getLightingSelectionError(configuration);
  if (error) throw new Error(error);
}

// A pure transition, used by the form and exercised by offline tests.
export function selectLighting(configuration: ProductConfiguration, kind: LightingKind, checked: boolean): ProductConfiguration {
  if (checked && !isLightingAvailable(kind, configuration.length, configuration.width)) return configuration;
  if (checked) return { ...configuration, hasLed: kind === "point", hasCob: kind === "cct", hasRgbCct: kind === "rgb_cct" };
  return { ...configuration, ...(kind === "point" ? {hasLed: false} : kind === "cct" ? {hasCob: false} : {hasRgbCct: false}) };
}

export function clearUnavailableLighting(configuration: ProductConfiguration): ProductConfiguration {
  return {
    ...configuration,
    hasLed: configuration.hasLed && isLightingAvailable("point", configuration.length, configuration.width),
    hasCob: configuration.hasCob && isLightingAvailable("cct", configuration.length, configuration.width),
    hasRgbCct: Boolean(configuration.hasRgbCct) && isLightingAvailable("rgb_cct", configuration.length, configuration.width),
  };
}
