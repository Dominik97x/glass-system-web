import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { QuoteItem } from "@/domain/QuoteItem";
import type { Quote } from "@/domain/Quote";

import { ConstructionCalculator } from "../calculators/ConstructionCalculator";
import { FilePriceRepository } from "../services/FilePriceRepository";
import { RoofCalculator } from "../calculators/RoofCalculator";
import { ZipCalculator } from "../calculators/ZipCalculator";
import { WallCalculator } from "../calculators/WallCalculator";
import { AwningCalculator } from "../calculators/AwningCalculator";
import { LedCalculator } from "../calculators/LedCalculator";
import { AccessoriesCalculator } from "../calculators/AccessoriesCalculator";


export class PricingEngine {
  private repository = new FilePriceRepository();

  calculate(configuration: ProductConfiguration): Quote {
    const items: QuoteItem[] = [];

    const constructionCalculator = new ConstructionCalculator(this.repository);

    const constructionPrice =
      constructionCalculator.calculate(configuration);

items.push({
  id: "construction",
  name: "Konstrukcja",
  category: "construction",
  quantity: 1,
  unitPriceGross: constructionPrice,
  totalPriceGross: constructionPrice,
});
const roofCalculator = new RoofCalculator(this.repository);
const roofPrice = roofCalculator.calculate(configuration);

if (roofPrice > 0) {
  items.push({
    id: "roof",
    name: "Pokrycie dachu",
    category: "roof",
    quantity: 1,
    unitPriceGross: roofPrice,
    totalPriceGross: roofPrice,
  });
}
const wallCalculator = new WallCalculator(this.repository);
const wallPrice = wallCalculator.calculate(configuration);

if (wallPrice > 0) {
  items.push({
    id: "walls",
    name: "Ściany przesuwne",
    category: "wall",
    quantity: 1,
    unitPriceGross: wallPrice,
    totalPriceGross: wallPrice,
  });
}
const zipCalculator = new ZipCalculator(this.repository);
const zipPrice = zipCalculator.calculate(configuration);

if (zipPrice > 0) {
  items.push({
    id: "zip",
    name: "Rolety ZIP",
    category: "zip",
    quantity: 1,
    unitPriceGross: zipPrice,
    totalPriceGross: zipPrice,
  });
}
const awningCalculator = new AwningCalculator(this.repository);
const awningPrice = awningCalculator.calculate(configuration);


if (awningPrice > 0) {
  items.push({
    id: "awning",
    name: "Markiza",
    category: "awning",
    quantity: 1,
    unitPriceGross: awningPrice,
    totalPriceGross: awningPrice,
  });
}
const ledCalculator = new LedCalculator(this.repository);
const ledPrice = ledCalculator.calculate(configuration);

if (ledPrice > 0) {
  items.push({
    id: "led",
    name: "Oświetlenie LED",
    category: "lighting",
    quantity: 1,
    unitPriceGross: ledPrice,
    totalPriceGross: ledPrice,
  });
}
const accessoriesCalculator = new AccessoriesCalculator(this.repository);
const accessoriesPrice = accessoriesCalculator.calculate(configuration);

if (accessoriesPrice > 0) {
  items.push({
    id: "accessories",
    name: "Akcesoria",
    category: "accessory",
    quantity: 1,
    unitPriceGross: accessoriesPrice,
    totalPriceGross: accessoriesPrice,
  });
}
    const totalGross = items.reduce(
  (sum, item) => sum + item.totalPriceGross,
  0
);

return {
  configuration,
  items,
  totalGross,
  currency: "PLN",
};
  }
}