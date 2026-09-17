import type { ProductBlueprint } from "./types";
import {
  buildPublishedCatalogProducts,
  normalizeDimension,
} from "./catalog-products";

export function buildPilotProducts(
  cwd: string,
  dimensions: string[]
): ProductBlueprint[] {
  const normalized = dimensions.map(normalizeDimension);
  const result = buildPublishedCatalogProducts(cwd, {
    dimensions: normalized,
    descriptionPrefix: "Pilot katalogu MoonGlass",
  });

  if (result.products.length === 0) {
    throw new Error(
      `Nie znaleziono aktywnych pozycji dla wymiarów: ${dimensions.join(", ")}. Format: głębokośćxszerokość, np. 300x306.`
    );
  }

  return result.products;
}
