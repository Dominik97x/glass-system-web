import type { PricingSnapshotPreparedBitrixProductRow } from "@/pricing/snapshots/PricingSnapshotBitrixProductMapper";
import type { Bitrix24ProductRow } from "./Bitrix24Types";

export function mapPreparedRowToBitrix24ProductRow(
  row: PricingSnapshotPreparedBitrixProductRow
): Bitrix24ProductRow {
  return {
    productId: row.productId,
    productName: row.productName,
    price: row.priceNet,
    quantity: row.quantity,
    sort: row.sort,
    taxRate: row.vatRate,
    taxIncluded: "N",
  };
}

export function mapPreparedRowsToBitrix24ProductRows(
  rows: PricingSnapshotPreparedBitrixProductRow[]
): Bitrix24ProductRow[] {
  return rows.map(mapPreparedRowToBitrix24ProductRow);
}