import type { Bitrix24Client } from "./Bitrix24Client";
import type { Bitrix24Config } from "./Bitrix24Config";
import {
  evaluatePaymentScheduleSync,
  PAYMENT_SCHEDULE_FIELDS,
  type DealStageSnapshot,
  type PaymentScheduleSyncDecision,
} from "@/lib/payment-schedule-sync-policy";

interface BitrixEnvelope<TResult> {
  result?: TResult;
}

interface Category {
  id?: number | string;
  name?: string;
}

interface Status {
  STATUS_ID?: string;
  NAME?: string;
  SORT?: number | string;
  SEMANTICS?: string;
}

export interface Bitrix24PaymentScheduleSyncResult {
  dealId: number;
  applied: boolean;
  skippedOutsideSalesPipeline: boolean;
  salesPipelineName: string;
  categoryId: number;
  decision?: PaymentScheduleSyncDecision;
}

export class Bitrix24PaymentScheduleSyncService {
  constructor(
    private readonly client: Bitrix24Client,
    private readonly config: Bitrix24Config
  ) {}

  async syncDeal(
    dealId: number,
    options: { apply: boolean }
  ): Promise<Bitrix24PaymentScheduleSyncResult> {
    const deal = await this.getDeal(dealId);
    const categoryId = parseCategoryId(deal.CATEGORY_ID ?? deal.categoryId);
    const salesCategoryId = await this.resolveSalesCategoryId();

    if (categoryId !== salesCategoryId) {
      return {
        dealId,
        applied: false,
        skippedOutsideSalesPipeline: true,
        salesPipelineName: this.config.salesPipelineName,
        categoryId,
      };
    }

    const stages = await this.getStages(categoryId);
    const totalGross = parsePositiveMoney(
      deal.OPPORTUNITY ?? deal.opportunity,
      dealId
    );
    const currency = String(deal.CURRENCY_ID ?? deal.currencyId ?? "PLN");
    const stageId = String(deal.STAGE_ID ?? deal.stageId ?? "");

    const decision = evaluatePaymentScheduleSync({
      dealId,
      totalGross,
      currency,
      stageId,
      contractDate: deal[PAYMENT_SCHEDULE_FIELDS.contractDate],
      advancePercent: deal[PAYMENT_SCHEDULE_FIELDS.advancePercent],
      advanceAmount: deal[PAYMENT_SCHEDULE_FIELDS.advanceAmount],
      stage2Amount: deal[PAYMENT_SCHEDULE_FIELDS.stage2Amount],
      stage3Amount: deal[PAYMENT_SCHEDULE_FIELDS.stage3Amount],
      stages,
    });

    if (options.apply && decision.action === "needs_update") {
      await this.updateDeal(dealId, decision.fieldsToUpdate);

      return {
        dealId,
        applied: true,
        skippedOutsideSalesPipeline: false,
        salesPipelineName: this.config.salesPipelineName,
        categoryId,
        decision,
      };
    }

    return {
      dealId,
      applied: false,
      skippedOutsideSalesPipeline: false,
      salesPipelineName: this.config.salesPipelineName,
      categoryId,
      decision,
    };
  }

  private async getDeal(dealId: number): Promise<Record<string, unknown>> {
    const response = await this.client.call<
      BitrixEnvelope<Record<string, unknown>>
    >("crm.deal.get", { id: dealId });

    if (!response.result) {
      throw new Error(`Bitrix24 nie zwrócił Deala #${dealId}.`);
    }

    return response.result;
  }

  private async resolveSalesCategoryId(): Promise<number> {
    const response = await this.client.call<
      BitrixEnvelope<{ categories?: Category[] }>
    >("crm.category.list", {
      entityTypeId: this.config.dealEntityTypeId,
    });

    const categories = response.result?.categories ?? [];
    const target = categories.find(
      (item) => item.name?.trim() === this.config.salesPipelineName.trim()
    );

    if (!target) {
      throw new Error(
        `Nie znaleziono lejka „${this.config.salesPipelineName}” w Bitrix24.`
      );
    }

    return parseCategoryId(target.id);
  }

  private async getStages(categoryId: number): Promise<DealStageSnapshot[]> {
    const entityId =
      categoryId === 0 ? "DEAL_STAGE" : `DEAL_STAGE_${categoryId}`;

    const response = await this.client.call<BitrixEnvelope<Status[]>>(
      "crm.status.list",
      {
        filter: { ENTITY_ID: entityId },
      }
    );

    return (response.result ?? []).map((item) => ({
      statusId: String(item.STATUS_ID ?? ""),
      name: String(item.NAME ?? ""),
      sort: Number(item.SORT ?? 0),
      semantics: String(item.SEMANTICS ?? ""),
    }));
  }

  private async updateDeal(
    dealId: number,
    fields: Record<string, unknown>
  ): Promise<void> {
    await this.client.call<BitrixEnvelope<boolean>>("crm.deal.update", {
      id: dealId,
      fields,
    });
  }
}

function parseCategoryId(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Nieprawidłowe CATEGORY_ID: ${String(value)}`);
  }
  return parsed;
}

function parsePositiveMoney(value: unknown, dealId: number): number {
  const parsed = Number(
    String(value ?? "").replace(/\s/g, "").replace(",", ".")
  );

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Deal #${dealId} nie ma prawidłowej dodatniej wartości OPPORTUNITY: ${String(
        value
      )}`
    );
  }

  return parsed;
}
