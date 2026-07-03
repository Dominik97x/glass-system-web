import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
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
}