import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";

export interface CalculatorInquiryRepository {
  save(lead: StoredCalculatorInquiryLead): Promise<void>;
}