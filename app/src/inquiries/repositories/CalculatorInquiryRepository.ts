import type {
  CalculatorInquiryStatus,
  StoredCalculatorInquiryLead,
} from "@/domain/StoredCalculatorInquiryLead";

export interface CalculatorInquiryRepository {
  save(lead: StoredCalculatorInquiryLead): Promise<void>;
  findAll(): Promise<StoredCalculatorInquiryLead[]>;
  findById(id: string): Promise<StoredCalculatorInquiryLead | null>;
  updateStatus(
    id: string,
    status: CalculatorInquiryStatus
  ): Promise<StoredCalculatorInquiryLead | null>;
}