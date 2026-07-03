import type {
  RoofOption,
  WallOption,
} from "@/domain/ProductConfiguration";

const roofOptionValues: RoofOption[] = [
  "polycarbonate_clear",
  "polycarbonate_milky",
  "polycarbonate_grey",
  "polycarbonate_smoke",
  "glass_clear",
  "glass_milky",
];

const wallOptionValues: WallOption[] = [
  "none",
  "glass_clear",
  "glass_milky",
  "glass_tinted",
];

export const ROOF_LABELS: Record<RoofOption, string> = {
  polycarbonate_clear: "Poliwęglan przezroczysty",
  polycarbonate_milky: "Poliwęglan mleczny",
  polycarbonate_grey: "Poliwęglan szary",
  polycarbonate_smoke: "Poliwęglan dymiony",
  glass_clear: "Szkło przezroczyste",
  glass_milky: "Szkło mleczne",
};

export const WALL_LABELS: Record<WallOption, string> = {
  none: "Brak ścian",
  glass_clear: "Szyby przezroczyste",
  glass_milky: "Szyby mleczne",
  glass_tinted: "Szyby przyciemniane",
};

export const ROOF_OPTIONS = roofOptionValues.map((value) => ({
  value,
  label: ROOF_LABELS[value],
}));

export const WALL_OPTIONS = wallOptionValues.map((value) => ({
  value,
  label: WALL_LABELS[value],
}));