import type {
  Length,
  ProductConfiguration,
  ProductKind,
  RoofOption,
  WallOption,
  Width,
} from "./ProductConfiguration";

export type ProductBase = "aluminium_construction";

export interface Product {
  id: string;
  base: ProductBase;
  name: string;
  defaultConfiguration: ProductConfiguration;
  availableWidths: Width[];
  availableLengths: Length[];
  availableWalls: WallOption[];
  availableRoofs: RoofOption[];
}

export const ALUMINIUM_CONSTRUCTION_PRODUCT: Product = {
  id: "aluminium-construction",
  base: "aluminium_construction",
  name: "Konstrukcja aluminiowa",
  defaultConfiguration: {
    width: 306,
    length: 300,
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
  },
  availableWidths: [306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206],
  availableLengths: [300, 350, 400, 450, 500],
  availableWalls: ["none", "glass_clear", "glass_milky", "glass_tinted"],
  availableRoofs: [
    "polycarbonate_clear",
    "polycarbonate_milky",
    "polycarbonate_grey",
    "polycarbonate_smoke",
    "glass_clear",
    "glass_milky",
  ],
};

export function resolveProductKind(
  configuration: ProductConfiguration
): ProductKind {
  return configuration.walls === "none" ? "terrace_roof" : "winter_garden";
}