import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { Quote } from "@/domain/Quote";
import type { QuoteItem } from "@/domain/QuoteItem";
import {EG_PRICE_MATRIX,type PriceMatrixRow,} from "@/data/pricing/eg/price-matrix";




function findPriceRow(configuration: ProductConfiguration): PriceMatrixRow {
  const row = EG_PRICE_MATRIX.find(
    (item) =>
      item.width === configuration.width &&
      item.length === configuration.length
  );

  if (!row) {
    throw new Error("Price row not found for selected configuration");
  }

  return row;
}

function getWallPrice(configuration: ProductConfiguration, row: PriceMatrixRow) {
  switch (configuration.walls) {
    case "none":
      return 0;
    case "glass_clear":
      return row.wallsClear;
    case "glass_milky":
      return row.wallsMilky;
    case "glass_tinted":
      return row.wallsTinted;
  }
}

export function calculateQuote(configuration: ProductConfiguration): Quote {
  const row = findPriceRow(configuration);

  const items: QuoteItem[] = [
    {
      id: "construction",
      name: `Konstrukcja aluminiowa ${configuration.length} x ${configuration.width}`,
      category: "construction",
      quantity: 1,
      unitPriceGross: row.construction,
      totalPriceGross: row.construction,
    },
  ];

  const wallPrice = getWallPrice(configuration, row);

  if (wallPrice > 0) {
    items.push({
      id: "walls",
      name: "Ściany szklane przesuwne",
      category: "wall",
      quantity: 1,
      unitPriceGross: wallPrice,
      totalPriceGross: wallPrice,
    });
  }

  const totalGross = items.reduce(
    (sum, item) => sum + item.totalPriceGross,
    0
  );

  return {
    id: "quote-preview",
    configuration,
    items,
    totalGross,
    currency: "PLN",
  };
}