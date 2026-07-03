import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";

export interface SubmitCalculatorInquiryResult {
  success: boolean;
  message: string;
}

export class CalculatorInquiryService {
  submit(lead: CalculatorInquiryLead): SubmitCalculatorInquiryResult {
    console.log("Calculator inquiry lead:", lead);

    return {
      success: true,
      message:
        "Zapytanie zostało przygotowane. Na tym etapie dane leada zapisaliśmy w konsoli przeglądarki.",
    };
  }
}