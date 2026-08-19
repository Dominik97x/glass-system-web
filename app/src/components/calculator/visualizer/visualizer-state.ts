import {
  getFrameColor,
  getProductKind,
  type FrameColor,
  type Length,
  type ProductConfiguration,
  type ProductKind,
  type RoofOption,
  type WallOption,
  type Width,
} from "@/domain/ProductConfiguration";

export type VisualizerLightingMode = "none" | "spot" | "cct";

/**
 * Minimalny, stabilny stan potrzebny wyłącznie do wyboru wizualizacji.
 *
 * Nie zawiera cen ani pól CRM. Dzięki temu renderer może rozwijać się
 * niezależnie od logiki cennika i synchronizacji Bitrix24.
 */
export interface VisualizerState {
  productType: ProductKind;
  frameColor: FrameColor;
  width: Width;
  length: Length;
  roof: RoofOption;
  walls: WallOption;
  zipFront: boolean;
  zipLeft: boolean;
  zipRight: boolean;
  awning: boolean;
  lighting: VisualizerLightingMode;
}

export function createVisualizerState(
  configuration: ProductConfiguration
): VisualizerState {
  return {
    productType: getProductKind(configuration),
    frameColor: getFrameColor(configuration),
    width: configuration.width,
    length: configuration.length,
    roof: configuration.roof,
    walls: configuration.walls,
    zipFront: configuration.hasFrontZip,
    zipLeft: configuration.hasLeftZip,
    zipRight: configuration.hasRightZip,
    awning: configuration.hasAwning,
    lighting: configuration.hasLed
      ? "spot"
      : configuration.hasCob
        ? "cct"
        : "none",
  };
}

export function hasVisualizerWalls(state: VisualizerState): boolean {
  return state.walls !== "none";
}

export function hasAnyVisualizerZip(state: VisualizerState): boolean {
  return state.zipFront || state.zipLeft || state.zipRight;
}

export function hasFullVisualizerZip(state: VisualizerState): boolean {
  return state.zipFront && state.zipLeft && state.zipRight;
}

/**
 * Klucz diagnostyczny/cache key. Wymiary są częścią stanu już teraz, mimo że
 * placeholdery V1A.2 nie mają jeszcze osobnych renderów dla każdego wymiaru.
 */
export function getVisualizerStateKey(state: VisualizerState): string {
  return [
    state.productType,
    `${state.length}x${state.width}`,
    state.frameColor,
    state.roof,
    state.walls,
    state.zipFront ? "zf1" : "zf0",
    state.zipLeft ? "zl1" : "zl0",
    state.zipRight ? "zr1" : "zr0",
    state.awning ? "a1" : "a0",
    `light-${state.lighting}`,
  ].join("__");
}
