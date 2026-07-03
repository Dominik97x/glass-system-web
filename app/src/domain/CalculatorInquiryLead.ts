import type { QuoteSnapshot } from "@/lib/quote-snapshot";

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
  quote: QuoteSnapshot;
}