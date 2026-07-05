import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type { CalculatorInquiryNotificationService } from "./CalculatorInquiryNotificationService";

export class CompositeCalculatorInquiryNotificationService
  implements CalculatorInquiryNotificationService
{
  constructor(
    private readonly notificationServices: CalculatorInquiryNotificationService[]
  ) {}

  async notify(lead: StoredCalculatorInquiryLead): Promise<void> {
    for (const notificationService of this.notificationServices) {
      await notificationService.notify(lead);
    }
  }
}