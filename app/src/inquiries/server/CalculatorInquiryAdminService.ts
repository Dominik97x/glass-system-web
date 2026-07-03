import type {
  CalculatorInquiryStatus,
  StoredCalculatorInquiryLead,
} from "@/domain/StoredCalculatorInquiryLead";
import { FileCalculatorInquiryRepository } from "@/inquiries/repositories/FileCalculatorInquiryRepository";

export class CalculatorInquiryAdminService {
  private repository = new FileCalculatorInquiryRepository();

  async getAllInquiries(): Promise<StoredCalculatorInquiryLead[]> {
    const inquiries = await this.repository.findAll();

    return inquiries.sort(
      (firstInquiry, secondInquiry) =>
        new Date(secondInquiry.receivedAt).getTime() -
        new Date(firstInquiry.receivedAt).getTime()
    );
  }

  async getInquiryById(
    id: string
  ): Promise<StoredCalculatorInquiryLead | null> {
    return this.repository.findById(id);
  }

  async updateInquiryStatus(
    id: string,
    status: CalculatorInquiryStatus
  ): Promise<StoredCalculatorInquiryLead | null> {
    return this.repository.updateStatus(id, status);
  }
}