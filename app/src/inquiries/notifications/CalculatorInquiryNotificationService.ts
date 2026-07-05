import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";

export interface CalculatorInquiryNotificationService {
  notify(lead: StoredCalculatorInquiryLead): Promise<void>;
}