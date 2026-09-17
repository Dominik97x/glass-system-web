import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type {
  CalculatorInquiryNotificationResult,
  CalculatorInquiryNotificationService,
} from "./CalculatorInquiryNotificationService";

export class CompositeCalculatorInquiryNotificationService
  implements CalculatorInquiryNotificationService
{
  constructor(
    private readonly notificationServices: CalculatorInquiryNotificationService[]
  ) {}

  async notify(
    lead: StoredCalculatorInquiryLead
  ): Promise<CalculatorInquiryNotificationResult> {
    const aggregate: CalculatorInquiryNotificationResult = {
      internalEmailSent: false,
      customerEmailSent: false,
    };

    for (const notificationService of this.notificationServices) {
      const result = await notificationService.notify(lead);

      aggregate.internalEmailSent =
        aggregate.internalEmailSent || result.internalEmailSent;
      aggregate.customerEmailSent =
        aggregate.customerEmailSent || result.customerEmailSent;
    }

    return aggregate;
  }
}
