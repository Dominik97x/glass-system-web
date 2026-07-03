import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";
import type { CalculatorInquiryRepository } from "@/inquiries/repositories/CalculatorInquiryRepository";

export interface HandleCalculatorInquiryResult {
  success: boolean;
  message: string;
}

export class CalculatorInquiryHandler {
  constructor(private repository: CalculatorInquiryRepository) {}

  async handle(
    lead: CalculatorInquiryLead
  ): Promise<HandleCalculatorInquiryResult> {
    await this.repository.save(lead);

    return {
      success: true,
      message:
        "Zapytanie zostało przyjęte. Na tym etapie backend zapisuje dane leada w konsoli serwera.",
    };
  }
}