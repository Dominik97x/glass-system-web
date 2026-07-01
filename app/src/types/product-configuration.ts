export type ProductKind = "terrace_roof" | "winter_garden";

export type Width =
  | 306
  | 406
  | 506
  | 606
  | 706
  | 806
  | 906
  | 1006
  | 1106
  | 1206;

export type Length = 300 | 350 | 400 | 450 | 500;

export type WallOption =
  | "none"
  | "glass_clear"
  | "glass_milky"
  | "glass_tinted";

export type RoofOption =
  | "polycarbonate_clear"
  | "polycarbonate_milky"
  | "polycarbonate_grey"
  | "polycarbonate_smoke"
  | "glass_clear"
  | "glass_milky";

export interface ProductConfiguration {
  width: Width;
  length: Length;

  walls: WallOption;
  roof: RoofOption;

  hasFrontZip: boolean;
  hasLeftZip: boolean;
  hasRightZip: boolean;

  hasAwning: boolean;
  hasLed: boolean;
  hasCob: boolean;

  hasHandles: boolean;
  hasBrushes: boolean;
  hasLevelingProfile: boolean;
}

export const DEFAULT_CONFIGURATION: ProductConfiguration = {
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
};

export function getProductKind(
  configuration: ProductConfiguration
): ProductKind {
  return configuration.walls === "none" ? "terrace_roof" : "winter_garden";
}