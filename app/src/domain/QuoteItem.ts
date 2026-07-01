export type QuoteItemCategory =
  | "construction"
  | "wall"
  | "roof"
  | "zip"
  | "awning"
  | "lighting"
  | "accessory"
  | "installation";

export interface QuoteItem {
  id: string;
  name: string;
  category: QuoteItemCategory;
  quantity: number;
  unitPriceGross: number;
  totalPriceGross: number;
}