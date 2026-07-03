import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type { Bitrix24ProductRow } from "./Bitrix24Types";

export function mapInquiryToBitrix24ProductRows(
  inquiry: StoredCalculatorInquiryLead
): Bitrix24ProductRow[] {
  return inquiry.quote.items.map((item, index) => ({
    productName: item.name,
    price: item.unitPriceGross,
    quantity: item.quantity,
    sort: index + 1,
  }));
}