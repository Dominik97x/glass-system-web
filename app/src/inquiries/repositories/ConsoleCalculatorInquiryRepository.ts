import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";
import type { CalculatorInquiryRepository } from "./CalculatorInquiryRepository";

export class ConsoleCalculatorInquiryRepository
  implements CalculatorInquiryRepository
{
  async save(lead: CalculatorInquiryLead): Promise<void> {
    console.log("Calculator inquiry lead saved:", lead);
  }
}