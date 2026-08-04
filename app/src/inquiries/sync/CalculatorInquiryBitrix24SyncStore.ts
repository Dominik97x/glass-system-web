import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import {
  type CalculatorInquiryDatabaseRow,
  mapDatabaseRowToStoredCalculatorInquiryLead,
} from "@/inquiries/repositories/DatabaseCalculatorInquiryRepository";
import { runCalculatorInquiryDatabaseOperation } from "@/inquiries/repositories/PostgresCalculatorInquiryDatabase";

const PROCESSING_STALE_AFTER_MINUTES = 10;

export class CalculatorInquiryBitrix24SyncStore {
  async claim(id: string): Promise<StoredCalculatorInquiryLead | null> {
    const result = await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query<CalculatorInquiryDatabaseRow>(
        `
          update calculator_inquiries
          set
            bitrix24_sync_status = 'processing',
            bitrix24_sync_attempts = bitrix24_sync_attempts + 1,
            bitrix24_last_attempt_at = now(),
            bitrix24_sync_started_at = now(),
            bitrix24_error = null,
            bitrix24_next_retry_at = null
          where id = $1
            and (
              bitrix24_sync_status in ('pending', 'failed')
              or (
                bitrix24_sync_status = 'processing'
                and bitrix24_sync_started_at < now() - make_interval(mins => $2::int)
              )
            )
          returning *
        `,
        [id, PROCESSING_STALE_AFTER_MINUTES]
      )
    );

    const row = result.rows[0];
    return row ? mapDatabaseRowToStoredCalculatorInquiryLead(row) : null;
  }

  async markSuccess(
    id: string,
    contactId: number,
    dealId: number
  ): Promise<void> {
    await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query(
        `
          update calculator_inquiries
          set
            bitrix24_sync_status = 'synced',
            bitrix24_contact_id = $2,
            bitrix24_deal_id = $3,
            bitrix24_error = null,
            bitrix24_synced_at = now(),
            bitrix24_sync_started_at = null,
            bitrix24_next_retry_at = null
          where id = $1
        `,
        [id, contactId, dealId]
      )
    );
  }

  async markFailure(
    id: string,
    errorMessage: string,
    nextRetryAt: Date
  ): Promise<void> {
    await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query(
        `
          update calculator_inquiries
          set
            bitrix24_sync_status = 'failed',
            bitrix24_error = $2,
            bitrix24_sync_started_at = null,
            bitrix24_next_retry_at = $3
          where id = $1
        `,
        [id, errorMessage.slice(0, 4000), nextRetryAt]
      )
    );
  }

  async resetForRetry(id: string): Promise<boolean> {
    const result = await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query(
        `
          update calculator_inquiries
          set
            bitrix24_sync_status = 'pending',
            bitrix24_error = null,
            bitrix24_sync_started_at = null,
            bitrix24_next_retry_at = null
          where id = $1
        `,
        [id]
      )
    );

    return (result.rowCount ?? 0) > 0;
  }

  async findRetryableIds(limit: number): Promise<string[]> {
    const result = await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query<{ id: string }>(
        `
          select id
          from calculator_inquiries
          where bitrix24_sync_status in ('pending', 'failed')
            and (
              bitrix24_next_retry_at is null
              or bitrix24_next_retry_at <= now()
            )
          order by received_at asc
          limit $1
        `,
        [limit]
      )
    );

    return result.rows.map((row) => row.id);
  }
}
