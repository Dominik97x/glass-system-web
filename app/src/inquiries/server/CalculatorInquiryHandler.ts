import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type { CalculatorInquiryNotificationService } from "../notifications/CalculatorInquiryNotificationService";
import { createCalculatorInquiryNotificationService } from "../notifications/CalculatorInquiryNotificationServiceFactory";
import type { CalculatorInquiryRepository } from "../repositories/CalculatorInquiryRepository";

export interface CalculatorInquiryHandlerResult {
  success: true;
  inquiryId: string;
  message: string;
}

export class CalculatorInquiryHandler {
  constructor(
    private readonly repository: CalculatorInquiryRepository,
    private readonly notificationService: CalculatorInquiryNotificationService =
      createCalculatorInquiryNotificationService()
  ) {}

  async handle(
    lead: CalculatorInquiryLead
  ): Promise<CalculatorInquiryHandlerResult> {
    const storedLead = createStoredCalculatorInquiryLead(lead);

    await this.repository.save(storedLead);
    await this.notifySafely(storedLead);

    return {
      success: true,
      inquiryId: storedLead.id,
      message: `Zapytanie zostało przyjęte. Numer zapytania: ${storedLead.id}`,
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
  lead: CalculatorInquiryLead
): StoredCalculatorInquiryLead {
  const now = new Date().toISOString();

  return {
    ...lead,
    id: `inq_${globalThis.crypto.randomUUID()}`,
    status: "new",
    receivedAt: now,
  };
}