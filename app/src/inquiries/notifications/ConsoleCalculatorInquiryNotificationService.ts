import {
  getProductKind,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type { CalculatorInquiryNotificationService } from "./CalculatorInquiryNotificationService";

interface QuoteSnapshotWithConfiguration {
  configuration?: ProductConfiguration;
  totalGross: number;
}

export class ConsoleCalculatorInquiryNotificationService
  implements CalculatorInquiryNotificationService
{
  async notify(lead: StoredCalculatorInquiryLead): Promise<void> {
    const quote = lead.quote as QuoteSnapshotWithConfiguration;
    const productKind = quote.configuration
      ? getProductKind(quote.configuration)
      : null;

    console.log("New calculator inquiry notification:", {
      id: lead.id,
      receivedAt: lead.receivedAt,
      status: lead.status,
      customer: {
        name: lead.customer.name,
        email: lead.customer.email,
        phone: lead.customer.phone,
      },
      quote: {
        productKind,
        totalGross: lead.quote.totalGross,
      },
    });
  }
}