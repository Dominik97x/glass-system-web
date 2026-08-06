import {
  getProductKind,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import {
  ROOF_LABELS,
  WALL_LABELS,
} from "@/data/configuration-labels";

export interface ConfigurationSummaryRow {
  label: string;
  value: string;
}

function getProductKindLabel(configuration: ProductConfiguration): string {
  const productKind = getProductKind(configuration);

  return productKind === "terrace_roof"
    ? "Zadaszenie tarasu"
    : "Ogród zimowy";
}

function getZipSummary(configuration: ProductConfiguration): string {
  const selectedZips: string[] = [];

  if (configuration.hasFrontZip) {
    selectedZips.push("przód");
  }

  if (configuration.hasLeftZip) {
    selectedZips.push("lewa");
  }

  if (configuration.hasRightZip) {
    selectedZips.push("prawa");
  }

  return selectedZips.length > 0 ? selectedZips.join(", ") : "Brak";
}

function getLightingSummary(configuration: ProductConfiguration): string {
  const selectedLighting: string[] = [];

  if (configuration.hasLed) {
    selectedLighting.push("LED punktowe");
  }

  if (configuration.hasCob) {
    selectedLighting.push("LED CCT");
  }

  return selectedLighting.length > 0
    ? selectedLighting.join(", ")
    : "Brak";
}

function getAccessoriesSummary(configuration: ProductConfiguration): string {
  const selectedAccessories: string[] = [];

  if (configuration.hasHandles) {
    selectedAccessories.push("uchwyty");
  }

  if (configuration.hasBrushes) {
    selectedAccessories.push("szczotki");
  }

  if (configuration.hasLevelingProfile) {
    selectedAccessories.push("profil wyrównujący");
  }

  return selectedAccessories.length > 0
    ? selectedAccessories.join(", ")
    : "Brak";
}

export function getConfigurationSummaryRows(
  configuration: ProductConfiguration
): ConfigurationSummaryRow[] {
  return [
    {
      label: "Typ produktu",
      value: getProductKindLabel(configuration),
    },
    {
      label: "Wymiary",
      value: `${configuration.length} × ${configuration.width} cm`,
    },
    {
      label: "Dach",
      value: ROOF_LABELS[configuration.roof],
    },
    {
      label: "Ściany",
      value: WALL_LABELS[configuration.walls],
    },
    {
      label: "Rolety ZIP",
      value: getZipSummary(configuration),
    },
    {
      label: "Markiza",
      value: configuration.hasAwning ? "Tak" : "Nie",
    },
    {
      label: "Oświetlenie",
      value: getLightingSummary(configuration),
    },
    {
      label: "Akcesoria",
      value: getAccessoriesSummary(configuration),
    },
  ];
}