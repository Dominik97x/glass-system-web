import type {
  CalculatorInquiryStatus,
  StoredCalculatorInquiryLead,
} from "@/domain/StoredCalculatorInquiryLead";
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

  async findById(): Promise<StoredCalculatorInquiryLead | null> {
    return null;
  }

  async updateStatus(
    id: string,
    status: CalculatorInquiryStatus
  ): Promise<StoredCalculatorInquiryLead | null> {
    console.log("Calculator inquiry status update:", { id, status });

    return null;
  }
}