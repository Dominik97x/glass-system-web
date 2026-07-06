import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import { createCalculatorInquiryNotificationMessage } from "./CalculatorInquiryNotificationMessage";
import type { CalculatorInquiryNotificationService } from "./CalculatorInquiryNotificationService";

export class ConsoleCalculatorInquiryNotificationService
  implements CalculatorInquiryNotificationService
{
  async notify(lead: StoredCalculatorInquiryLead): Promise<void> {
    const message = createCalculatorInquiryNotificationMessage(lead);

    console.log("New calculator inquiry notification");
    console.log("Inquiry ID:", lead.id);
    console.log("Subject:", message.subject);
    console.log("");
    console.log(message.text);
  }
}