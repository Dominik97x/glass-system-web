import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import type { CalculatorInquiryRepository } from "./CalculatorInquiryRepository";

export class ConsoleCalculatorInquiryRepository
  implements CalculatorInquiryRepository
{
  async save(lead: StoredCalculatorInquiryLead): Promise<void> {
    console.log("Calculator inquiry lead saved:", lead);
  }

  async findAll(): Promise<StoredCalculatorInquiryLead[]> {
    return [];
  }
}