import type { CalculatorInquiryLead } from "./CalculatorInquiryLead";

export type CalculatorInquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "won"
  | "lost";

export interface StoredCalculatorInquiryLead
  extends CalculatorInquiryLead {
  id: string;
  status: CalculatorInquiryStatus;
  receivedAt: string;
}