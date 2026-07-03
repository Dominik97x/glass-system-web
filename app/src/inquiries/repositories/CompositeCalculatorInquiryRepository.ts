import type {
  CalculatorInquiryStatus,
  StoredCalculatorInquiryLead,
} from "@/domain/StoredCalculatorInquiryLead";
import type { CalculatorInquiryRepository } from "./CalculatorInquiryRepository";

export class CompositeCalculatorInquiryRepository
  implements CalculatorInquiryRepository
{
  constructor(
    private readonly primaryRepository: CalculatorInquiryRepository,
    private readonly secondaryRepositories: CalculatorInquiryRepository[]
  ) {}

  async save(lead: StoredCalculatorInquiryLead): Promise<void> {
    await this.primaryRepository.save(lead);

    for (const repository of this.secondaryRepositories) {
      await repository.save(lead);
    }
  }

  async findAll(): Promise<StoredCalculatorInquiryLead[]> {
    return this.primaryRepository.findAll();
  }

  async findById(
    id: string
  ): Promise<StoredCalculatorInquiryLead | null> {
    return this.primaryRepository.findById(id);
  }

  async updateStatus(
    id: string,
    status: CalculatorInquiryStatus
  ): Promise<StoredCalculatorInquiryLead | null> {
    return this.primaryRepository.updateStatus(id, status);
  }
}