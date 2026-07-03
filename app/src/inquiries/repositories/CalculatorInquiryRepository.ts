import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";

export interface CalculatorInquiryRepository {
  save(lead: CalculatorInquiryLead): Promise<void>;
}