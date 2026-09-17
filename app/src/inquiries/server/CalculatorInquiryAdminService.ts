import type {
  CalculatorInquiryStatus,
  StoredCalculatorInquiryLead,
} from "@/domain/StoredCalculatorInquiryLead";
import { createCalculatorInquiryRepository } from "@/inquiries/repositories/CalculatorInquiryRepositoryFactory";
import { CalculatorInquiryBitrix24SyncService } from "@/inquiries/sync/CalculatorInquiryBitrix24SyncService";

export class CalculatorInquiryAdminService {
  private repository = createCalculatorInquiryRepository();
  private bitrix24SyncService = new CalculatorInquiryBitrix24SyncService();

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

  async retryBitrix24Sync(id: string): Promise<void> {
    await this.bitrix24SyncService.retryInquiry(id);
  }

  async updateInquiryStatus(
    id: string,
    status: CalculatorInquiryStatus
  ): Promise<StoredCalculatorInquiryLead | null> {
    return this.repository.updateStatus(id, status);
  }
}