export interface LedPriceRow {
  width: number;
  length: number;
  pointLedPriceGross: number;
  stripLedPriceGross: number;
}

export const EG_LED_PRICES: LedPriceRow[] = [
  {
    width: 306,
    length: 300,
    pointLedPriceGross: 999,
    stripLedPriceGross: 1656,
  },
  {
    width: 406,
    length: 300,
    pointLedPriceGross: 1544,
    stripLedPriceGross: 1942,
  },
  {
    width: 506,
    length: 300,
    pointLedPriceGross: 1912,
    stripLedPriceGross: 2227,
  },
];