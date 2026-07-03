import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";

export interface HandleCalculatorInquiryResult {
  success: boolean;
  message: string;
}

export class CalculatorInquiryHandler {
  handle(lead: CalculatorInquiryLead): HandleCalculatorInquiryResult {
    console.log("Calculator inquiry lead received by API:", lead);

    return {
      success: true,
      message:
        "Zapytanie zostało przyjęte. Na tym etapie backend zapisuje dane leada w konsoli serwera.",
    };
  }
}