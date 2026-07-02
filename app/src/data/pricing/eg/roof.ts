export interface RoofPriceRow {
  width: number;
  length: number;
  polycarbonateClear: number;
  polycarbonateMilky: number;
  polycarbonateGrey: number;
  polycarbonateSmoke: number;
  glassClear: number;
  glassMilky: number;
}

export const EG_ROOF_PRICES: RoofPriceRow[] = [
  {
    width: 306,
    length: 300,
    polycarbonateClear: 0,
    polycarbonateMilky: 396,
    polycarbonateGrey: 164,
    polycarbonateSmoke: 164,
    glassClear: 3000,
    glassMilky: 3465,
  },
  {
    width: 406,
    length: 300,
    polycarbonateClear: 0,
    polycarbonateMilky: 253,
    polycarbonateGrey: 253,
    polycarbonateSmoke: 253,
    glassClear: 3423,
    glassMilky: 4036,
  },
  {
    width: 506,
    length: 300,
    polycarbonateClear: 0,
    polycarbonateMilky: 342,
    polycarbonateGrey: 342,
    polycarbonateSmoke: 342,
    glassClear: 4214,
    glassMilky: 4979,
  },
];