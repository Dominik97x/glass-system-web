import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type { CalculatorInquiryRepository } from "@/inquiries/repositories/CalculatorInquiryRepository";

export interface HandleCalculatorInquiryResult {
  success: boolean;
  message: string;
  inquiryId: string;
}

export class CalculatorInquiryHandler {
  constructor(private repository: CalculatorInquiryRepository) {}

  async handle(
    lead: CalculatorInquiryLead
  ): Promise<HandleCalculatorInquiryResult> {
    const storedLead = this.createStoredLead(lead);

    await this.repository.save(storedLead);

    return {
      success: true,
      inquiryId: storedLead.id,
      message: `Zapytanie zostało przyjęte. Numer zapytania: ${storedLead.id}`,
    };
  }

  private createStoredLead(
    lead: CalculatorInquiryLead
  ): StoredCalculatorInquiryLead {
    return {
      ...lead,
      id: createInquiryId(),
      status: "new",
      receivedAt: new Date().toISOString(),
    };
  }
}

function createInquiryId(): string {
  return `inq_${globalThis.crypto.randomUUID()}`;
}