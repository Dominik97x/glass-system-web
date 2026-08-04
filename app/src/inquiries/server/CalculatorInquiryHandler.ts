import type { CalculatorInquirySubmission } from "@/domain/CalculatorInquirySubmission";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type { CalculatorInquiryNotificationService } from "../notifications/CalculatorInquiryNotificationService";
import { createCalculatorInquiryNotificationService } from "../notifications/CalculatorInquiryNotificationServiceFactory";
import type { CalculatorInquiryRepository } from "../repositories/CalculatorInquiryRepository";
import { CalculatorInquiryQuoteService } from "./CalculatorInquiryQuoteService";

export interface CalculatorInquiryHandlerResult {
  success: true;
  inquiryId: string;
  message: string;
  totalGross: number;
}

export class CalculatorInquiryHandler {
  constructor(
    private readonly repository: CalculatorInquiryRepository,
    private readonly notificationService: CalculatorInquiryNotificationService =
      createCalculatorInquiryNotificationService(),
    private readonly quoteService: CalculatorInquiryQuoteService =
      new CalculatorInquiryQuoteService()
  ) {}

  async handle(
    submission: CalculatorInquirySubmission
  ): Promise<CalculatorInquiryHandlerResult> {
    const trustedLead = this.quoteService.createTrustedLead(submission);
    const storedLead = createStoredCalculatorInquiryLead(trustedLead);

    await this.repository.save(storedLead);
    await this.notifySafely(storedLead);

    return {
      success: true,
      inquiryId: storedLead.id,
      message: `Zapytanie zostało przyjęte. Numer zapytania: ${storedLead.id}. Zweryfikowana wartość konfiguracji: ${storedLead.quote.totalGross.toLocaleString("pl-PL")} zł.`,
      totalGross: storedLead.quote.totalGross,
    };
  }

  private async notifySafely(
    lead: StoredCalculatorInquiryLead
  ): Promise<void> {
    try {
      await this.notificationService.notify(lead);
    } catch (error) {
      console.error("Calculator inquiry notification failed:", {
        inquiryId: lead.id,
        error,
      });
    }
  }
}

function createStoredCalculatorInquiryLead(
  lead: Omit<StoredCalculatorInquiryLead, "id" | "status" | "receivedAt">
): StoredCalculatorInquiryLead {
  const now = new Date().toISOString();

  return {
    ...lead,
    id: `inq_${globalThis.crypto.randomUUID()}`,
    status: "new",
    receivedAt: now,
  };
}
