export interface WallPriceRow {
  width: number;
  length: number;
  glassClearPriceGross: number;
  glassMilkyPriceGross: number;
  glassTintedPriceGross: number;
}

export const EG_WALL_PRICES: WallPriceRow[] = [
  {
    width: 306,
    length: 300,
    glassClearPriceGross: 15029,
    glassMilkyPriceGross: 16502,
    glassTintedPriceGross: 16502,
  },
  {
    width: 406,
    length: 300,
    glassClearPriceGross: 16280,
    glassMilkyPriceGross: 17917,
    glassTintedPriceGross: 17917,
  },
  {
    width: 506,
    length: 300,
    glassClearPriceGross: 18471,
    glassMilkyPriceGross: 20270,
    glassTintedPriceGross: 20270,
  },
];