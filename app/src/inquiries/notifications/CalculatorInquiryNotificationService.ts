import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";

export interface CalculatorInquiryNotificationResult {
  internalEmailSent: boolean;
  customerEmailSent: boolean;
}

export interface CalculatorInquiryNotificationService {
  notify(
    lead: StoredCalculatorInquiryLead
  ): Promise<CalculatorInquiryNotificationResult>;
}
