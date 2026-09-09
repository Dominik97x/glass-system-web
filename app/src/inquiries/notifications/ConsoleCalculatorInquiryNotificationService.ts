import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import {
  createCalculatorInquiryCustomerMessage,
  createCalculatorInquiryNotificationMessage,
} from "./CalculatorInquiryNotificationMessage";
import type {
  CalculatorInquiryNotificationResult,
  CalculatorInquiryNotificationService,
} from "./CalculatorInquiryNotificationService";

export class ConsoleCalculatorInquiryNotificationService
  implements CalculatorInquiryNotificationService
{
  async notify(
    lead: StoredCalculatorInquiryLead
  ): Promise<CalculatorInquiryNotificationResult> {
    const internalMessage = createCalculatorInquiryNotificationMessage(lead);
    const customerMessage = createCalculatorInquiryCustomerMessage(lead);

    console.log("New calculator inquiry notification");
    console.log("Inquiry ID:", lead.id);
    console.log("Internal subject:", internalMessage.subject);
    console.log("");
    console.log(internalMessage.text);
    console.log("");
    console.log("Customer confirmation preview");
    console.log("Customer e-mail:", lead.customer.email);
    console.log("Customer subject:", customerMessage.subject);
    console.log("");
    console.log(customerMessage.text);

    return {
      internalEmailSent: false,
      customerEmailSent: false,
    };
  }
}
