import type { ProductConfiguration } from "@/domain/ProductConfiguration";

export type VisualizerAssetKey =
  | "terrace_roof_day"
  | "terrace_roof_evening_led"
  | "winter_garden_clear"
  | "winter_garden_milky"
  | "winter_garden_tinted"
  | "winter_garden_zip_front"
  | "winter_garden_zip_full"
  | "winter_garden_awning"
  | "winter_garden_led_spot"
  | "winter_garden_led_strip";

export type VisualizerMode = "day" | "evening";

export interface VisualizerAsset {
  key: VisualizerAssetKey;
  label: string;
  shortLabel: string;
  description: string;
  src: string;
  thumbnailSrc: string;
  mode: VisualizerMode;
  product: "terrace_roof" | "winter_garden";
}

/**
 * Aktualne obrazy są placeholderami z etapu planowania.
 *
 * Docelowo ten plik będzie jedynym miejscem, w którym podmieniamy ścieżki
 * na finalne rendery stworzone pod nasz konfigurator.
 *
 * Kierunek finalnych renderów:
 * - własna perspektywa, nie kopia strony inspiracyjnej,
 * - kompozycja bliżej aktualnej referencji z masywną belką frontową,
 * - antracytowa konstrukcja,
 * - realistyczne słupy, krokwie, prowadnice i szklenie,
 * - osobne warianty dla szyb, ZIP, markizy i LED.
 */
const CURRENT_IMAGES = {
  terraceRoof: "/images/glass-system/product-terrace-roof-sunset.png",
  winterGarden: "/images/glass-system/product-winter-garden-day.png",
  glassEnclosure: "/images/glass-system/gallery-glass-enclosure-day.png",
  evening: "/images/glass-system/hero-winter-garden-evening.png",
  eveningLed: "/images/glass-system/parallax-evening-led.png",
} as const;

export const VISUALIZER_ASSETS = {
  terrace_roof_day: {
    key: "terrace_roof_day",
    label: "Zadaszenie tarasu",
    shortLabel: "Brak ścian",
    description: "Otwarta konstrukcja tarasowa bez ścian przesuwnych.",
    src: CURRENT_IMAGES.terraceRoof,
    thumbnailSrc: CURRENT_IMAGES.terraceRoof,
    mode: "day",
    product: "terrace_roof",
  },
  terrace_roof_evening_led: {
    key: "terrace_roof_evening_led",
    label: "Zadaszenie tarasu z oświetleniem",
    shortLabel: "Wieczór LED",
    description: "Otwarta konstrukcja z podświetleniem w trybie wieczornym.",
    src: CURRENT_IMAGES.eveningLed,
    thumbnailSrc: CURRENT_IMAGES.eveningLed,
    mode: "evening",
    product: "terrace_roof",
  },
  winter_garden_clear: {
    key: "winter_garden_clear",
    label: "Ogród zimowy ze szkłem przezroczystym",
    shortLabel: "Przezroczyste",
    description: "Zabudowa tarasu z przezroczystymi ścianami przesuwnymi.",
    src: CURRENT_IMAGES.winterGarden,
    thumbnailSrc: CURRENT_IMAGES.winterGarden,
    mode: "day",
    product: "winter_garden",
  },
  winter_garden_milky: {
    key: "winter_garden_milky",
    label: "Ogród zimowy ze szkłem mlecznym",
    shortLabel: "Mleczne",
    description: "Zabudowa tarasu ze szkłem ograniczającym widoczność.",
    src: CURRENT_IMAGES.glassEnclosure,
    thumbnailSrc: CURRENT_IMAGES.glassEnclosure,
    mode: "day",
    product: "winter_garden",
  },
  winter_garden_tinted: {
    key: "winter_garden_tinted",
    label: "Ogród zimowy ze szkłem przyciemnianym",
    shortLabel: "Przyciem.",
    description: "Zabudowa tarasu z przyciemnianymi szybami przesuwnymi.",
    src: CURRENT_IMAGES.glassEnclosure,
    thumbnailSrc: CURRENT_IMAGES.glassEnclosure,
    mode: "day",
    product: "winter_garden",
  },
  winter_garden_zip_front: {
    key: "winter_garden_zip_front",
    label: "Ogród zimowy z roletą ZIP z przodu",
    shortLabel: "ZIP przód",
    description: "Zabudowa tarasu z przednią osłoną ZIP.",
    src: CURRENT_IMAGES.winterGarden,
    thumbnailSrc: CURRENT_IMAGES.winterGarden,
    mode: "day",
    product: "winter_garden",
  },
  winter_garden_zip_full: {
    key: "winter_garden_zip_full",
    label: "Ogród zimowy z roletami ZIP",
    shortLabel: "ZIP pełny",
    description: "Zabudowa tarasu z roletami ZIP na wybranych stronach.",
    src: CURRENT_IMAGES.winterGarden,
    thumbnailSrc: CURRENT_IMAGES.winterGarden,
    mode: "day",
    product: "winter_garden",
  },
  winter_garden_awning: {
    key: "winter_garden_awning",
    label: "Ogród zimowy z markizą",
    shortLabel: "Markiza",
    description: "Zabudowa tarasu z osłoną przeciwsłoneczną.",
    src: CURRENT_IMAGES.winterGarden,
    thumbnailSrc: CURRENT_IMAGES.winterGarden,
    mode: "day",
    product: "winter_garden",
  },
  winter_garden_led_spot: {
    key: "winter_garden_led_spot",
    label: "Ogród zimowy z LED punktowym",
    shortLabel: "LED punkt.",
    description: "Zabudowa tarasu z punktowym oświetleniem LED.",
    src: CURRENT_IMAGES.evening,
    thumbnailSrc: CURRENT_IMAGES.evening,
    mode: "evening",
    product: "winter_garden",
  },
  winter_garden_led_strip: {
    key: "winter_garden_led_strip",
    label: "Ogród zimowy z LED CCT",
    shortLabel: "LED CCT",
    description: "Zabudowa tarasu z liniowym oświetleniem LED CCT.",
    src: CURRENT_IMAGES.eveningLed,
    thumbnailSrc: CURRENT_IMAGES.eveningLed,
    mode: "evening",
    product: "winter_garden",
  },
} satisfies Record<VisualizerAssetKey, VisualizerAsset>;

export const VISUALIZER_TILES = [
  {
    id: "terrace_roof",
    label: "Brak ścian",
    assetKey: "terrace_roof_day",
  },
  {
    id: "glass_clear",
    label: "Przezroczyste",
    assetKey: "winter_garden_clear",
  },
  {
    id: "glass_milky",
    label: "Mleczne",
    assetKey: "winter_garden_milky",
  },
  {
    id: "zip",
    label: "ZIP",
    assetKey: "winter_garden_zip_front",
  },
  {
    id: "awning",
    label: "Markiza",
    assetKey: "winter_garden_awning",
  },
  {
    id: "lighting",
    label: "Wieczór LED",
    assetKey: "winter_garden_led_spot",
  },
] as const;

export type VisualizerTileId = (typeof VISUALIZER_TILES)[number]["id"];

export function getVisualizerAsset(
  configuration: ProductConfiguration
): VisualizerAsset {
  const hasWalls = configuration.walls !== "none";
  const hasAnyZip =
    configuration.hasFrontZip ||
    configuration.hasLeftZip ||
    configuration.hasRightZip;
  const hasFullZip =
    hasWalls &&
    configuration.hasFrontZip &&
    configuration.hasLeftZip &&
    configuration.hasRightZip;

  if (!hasWalls) {
    if (configuration.hasLed || configuration.hasCob) {
      return VISUALIZER_ASSETS.terrace_roof_evening_led;
    }

    return VISUALIZER_ASSETS.terrace_roof_day;
  }

  if (configuration.hasCob) {
    return VISUALIZER_ASSETS.winter_garden_led_strip;
  }

  if (configuration.hasLed) {
    return VISUALIZER_ASSETS.winter_garden_led_spot;
  }

  if (configuration.hasAwning) {
    return VISUALIZER_ASSETS.winter_garden_awning;
  }

  if (hasFullZip) {
    return VISUALIZER_ASSETS.winter_garden_zip_full;
  }

  if (hasAnyZip) {
    return VISUALIZER_ASSETS.winter_garden_zip_front;
  }

  if (configuration.walls === "glass_milky") {
    return VISUALIZER_ASSETS.winter_garden_milky;
  }

  if (configuration.walls === "glass_tinted") {
    return VISUALIZER_ASSETS.winter_garden_tinted;
  }

  return VISUALIZER_ASSETS.winter_garden_clear;
}

export function getVisualizerAssetByKey(
  key: VisualizerAssetKey
): VisualizerAsset {
  return VISUALIZER_ASSETS[key];
}