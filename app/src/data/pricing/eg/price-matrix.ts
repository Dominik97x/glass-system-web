export interface PriceMatrixRow {
  width: number;
  length: number;
  construction: number;
  wallsClear: number;
  wallsMilky: number;
  wallsTinted: number;
}

export const EG_PRICE_MATRIX: PriceMatrixRow[] = [
  {
    width: 306,
    length: 300,
    construction: 8383,
    wallsClear: 15029,
    wallsMilky: 16502,
    wallsTinted: 16502,
  },
];