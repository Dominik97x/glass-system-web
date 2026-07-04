import type {
  CalculatorInquiryStatus,
  StoredCalculatorInquiryLead,
} from "@/domain/StoredCalculatorInquiryLead";
import { Bitrix24Client } from "@/integrations/bitrix24/Bitrix24Client";
import { getBitrix24Config } from "@/integrations/bitrix24/Bitrix24Config";
import { mapInquiryToBitrix24DealPayload } from "@/integrations/bitrix24/Bitrix24DealMapper";
import { createBitrix24InquiryProductRowProvider } from "@/integrations/bitrix24/Bitrix24InquiryProductRowProvider";
import type { CalculatorInquiryRepository } from "./CalculatorInquiryRepository";

export class Bitrix24CalculatorInquiryRepository
  implements CalculatorInquiryRepository
{
  private readonly config = getBitrix24Config();
  private readonly client = new Bitrix24Client(this.config);
  private readonly productRowProvider = createBitrix24InquiryProductRowProvider();

  async save(lead: StoredCalculatorInquiryLead): Promise<void> {
    const dealPayload = mapInquiryToBitrix24DealPayload(lead, this.config);
    const dealResponse = await this.client.addCrmItem(dealPayload);
    const dealId = dealResponse.result?.item?.id;

    if (!dealId) {
      throw new Error("Bitrix24 did not return created deal id");
    }

    const productRows = await this.productRowProvider.buildProductRows(lead);

    if (productRows.length > 0) {
      await this.client.setProductRows({
        ownerType: this.config.dealOwnerType,
        ownerId: dealId,
        productRows,
      });
    }
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
    console.log("Bitrix24 status update is not implemented yet:", {
      id,
      status,
    });

    return null;
  }
}