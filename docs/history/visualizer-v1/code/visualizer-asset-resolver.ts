import type {
  FrameColor,
  RoofOption,
  WallOption,
} from "@/domain/ProductConfiguration";
import {
  VISUALIZER_ASSETS,
  type VisualizerAsset,
  type VisualizerAssetKey,
} from "./visualizer-assets";
import {
  getVisualizerStateKey,
  hasAnyVisualizerZip,
  hasFullVisualizerZip,
  hasVisualizerWalls,
  type VisualizerState,
} from "./visualizer-state";

export type VisualizerLayerKey =
  | `frame:${FrameColor}`
  | `roof:${RoofOption}`
  | `walls:${Exclude<WallOption, "none">}`
  | "zip:front"
  | "zip:left"
  | "zip:right"
  | "awning"
  | "lighting:spot"
  | "lighting:cct";

export interface ResolvedVisualizerScene {
  stateKey: string;
  primaryAssetKey: VisualizerAssetKey;
  primaryAsset: VisualizerAsset;
  plannedLayers: VisualizerLayerKey[];
}

/**
 * V1A.2 nadal wyświetla dotychczasowe placeholdery, ale wybór obrazu jest już
 * wykonywany na podstawie VisualizerState. Kiedy pojawią się rendery z Blendera,
 * ten resolver będzie miejscem przejścia z jednej grafiki na kompozycję warstw.
 */
export function resolveVisualizerScene(
  state: VisualizerState
): ResolvedVisualizerScene {
  const primaryAssetKey = resolvePrimaryAssetKey(state);

  return {
    stateKey: getVisualizerStateKey(state),
    primaryAssetKey,
    primaryAsset: VISUALIZER_ASSETS[primaryAssetKey],
    plannedLayers: resolvePlannedLayers(state),
  };
}

function resolvePrimaryAssetKey(state: VisualizerState): VisualizerAssetKey {
  const hasWalls = hasVisualizerWalls(state);

  if (!hasWalls) {
    return state.lighting === "none"
      ? "terrace_roof_day"
      : "terrace_roof_evening_led";
  }

  if (state.lighting === "cct") {
    return "winter_garden_led_strip";
  }

  if (state.lighting === "spot") {
    return "winter_garden_led_spot";
  }

  if (state.awning) {
    return "winter_garden_awning";
  }

  if (hasFullVisualizerZip(state)) {
    return "winter_garden_zip_full";
  }

  if (hasAnyVisualizerZip(state)) {
    return "winter_garden_zip_front";
  }

  if (state.walls === "glass_milky") {
    return "winter_garden_milky";
  }

  if (state.walls === "glass_tinted") {
    return "winter_garden_tinted";
  }

  return "winter_garden_clear";
}

function resolvePlannedLayers(state: VisualizerState): VisualizerLayerKey[] {
  const layers: VisualizerLayerKey[] = [
    `frame:${state.frameColor}`,
    `roof:${state.roof}`,
  ];

  if (state.walls !== "none") {
    layers.push(`walls:${state.walls}`);
  }

  if (state.zipFront) {
    layers.push("zip:front");
  }

  if (state.zipLeft) {
    layers.push("zip:left");
  }

  if (state.zipRight) {
    layers.push("zip:right");
  }

  if (state.awning) {
    layers.push("awning");
  }

  if (state.lighting === "spot") {
    layers.push("lighting:spot");
  }

  if (state.lighting === "cct") {
    layers.push("lighting:cct");
  }

  return layers;
}
