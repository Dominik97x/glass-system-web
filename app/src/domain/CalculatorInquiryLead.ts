import type { QuoteSnapshot } from "@/lib/quote-snapshot";
import type { CalculatorInquiryAttribution } from "./CalculatorInquiryAttribution";

export interface CalculatorInquiryCustomer {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface CalculatorInquiryLead {
  source: "calculator";
  createdAt: string;
  customer: CalculatorInquiryCustomer;
  attribution?: CalculatorInquiryAttribution;
  quote: QuoteSnapshot;
}
