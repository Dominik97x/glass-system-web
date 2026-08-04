import type {
  Bitrix24SyncStatus,
  CalculatorInquiryStatus,
  StoredCalculatorInquiryLead,
} from "@/domain/StoredCalculatorInquiryLead";
import type { QuoteSnapshot } from "@/lib/quote-snapshot";
import type { CalculatorInquiryRepository } from "./CalculatorInquiryRepository";
import { runCalculatorInquiryDatabaseOperation } from "./PostgresCalculatorInquiryDatabase";

export interface CalculatorInquiryDatabaseRow {
  id: string;
  source: string;
  status: CalculatorInquiryStatus;
  created_at: Date | string;
  received_at: Date | string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_message: string;
  quote_total_gross: string | number;
  quote_snapshot: unknown;
  bitrix24_sync_status: Bitrix24SyncStatus;
  bitrix24_contact_id: string | number | null;
  bitrix24_deal_id: string | number | null;
  bitrix24_sync_attempts: string | number;
  bitrix24_error: string | null;
  bitrix24_last_attempt_at: Date | string | null;
  bitrix24_sync_started_at: Date | string | null;
  bitrix24_synced_at: Date | string | null;
  bitrix24_next_retry_at: Date | string | null;
  notification_status: string;
  notification_error: string | null;
  created_in_database_at: Date | string;
  updated_at: Date | string;
}

export class DatabaseCalculatorInquiryRepository
  implements CalculatorInquiryRepository
{
  async save(lead: StoredCalculatorInquiryLead): Promise<void> {
    await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query(
        `
          insert into calculator_inquiries (
            id,
            source,
            status,
            created_at,
            received_at,
            customer_name,
            customer_email,
            customer_phone,
            customer_message,
            quote_total_gross,
            quote_snapshot,
            bitrix24_sync_status,
            notification_status
          )
          values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11::jsonb,
            $12,
            $13
          )
          on conflict (id) do nothing
        `,
        [
          lead.id,
          lead.source,
          lead.status,
          lead.createdAt,
          lead.receivedAt,
          lead.customer.name,
          lead.customer.email,
          lead.customer.phone,
          lead.customer.message,
          lead.quote.totalGross,
          JSON.stringify(lead.quote),
          getInitialBitrix24SyncStatus(),
          getInitialNotificationStatus(),
        ]
      )
    );
  }

  async findAll(): Promise<StoredCalculatorInquiryLead[]> {
    const result = await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query<CalculatorInquiryDatabaseRow>(
        `
          select *
          from calculator_inquiries
          order by received_at desc
        `
      )
    );

    return result.rows.map(mapDatabaseRowToStoredCalculatorInquiryLead);
  }

  async findById(id: string): Promise<StoredCalculatorInquiryLead | null> {
    const result = await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query<CalculatorInquiryDatabaseRow>(
        `
          select *
          from calculator_inquiries
          where id = $1
          limit 1
        `,
        [id]
      )
    );

    const row = result.rows[0];
    return row ? mapDatabaseRowToStoredCalculatorInquiryLead(row) : null;
  }

  async updateStatus(
    id: string,
    status: CalculatorInquiryStatus
  ): Promise<StoredCalculatorInquiryLead | null> {
    const result = await runCalculatorInquiryDatabaseOperation((pool) =>
      pool.query<CalculatorInquiryDatabaseRow>(
        `
          update calculator_inquiries
          set status = $2
          where id = $1
          returning *
        `,
        [id, status]
      )
    );

    const row = result.rows[0];
    return row ? mapDatabaseRowToStoredCalculatorInquiryLead(row) : null;
  }
}

export function mapDatabaseRowToStoredCalculatorInquiryLead(
  row: CalculatorInquiryDatabaseRow
): StoredCalculatorInquiryLead {
  return {
    id: row.id,
    source: "calculator",
    createdAt: toIsoString(row.created_at),
    receivedAt: toIsoString(row.received_at),
    status: row.status,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      message: row.customer_message,
    },
    quote: parseQuoteSnapshot(row.quote_snapshot),
    bitrix24: {
      status: row.bitrix24_sync_status,
      contactId: toNullableNumber(row.bitrix24_contact_id),
      dealId: toNullableNumber(row.bitrix24_deal_id),
      attempts: Number(row.bitrix24_sync_attempts ?? 0),
      lastError: row.bitrix24_error,
      lastAttemptAt: toNullableIsoString(row.bitrix24_last_attempt_at),
      startedAt: toNullableIsoString(row.bitrix24_sync_started_at),
      syncedAt: toNullableIsoString(row.bitrix24_synced_at),
      nextRetryAt: toNullableIsoString(row.bitrix24_next_retry_at),
    },
  };
}

function parseQuoteSnapshot(value: unknown): QuoteSnapshot {
  if (typeof value === "string") {
    return JSON.parse(value) as QuoteSnapshot;
  }

  return value as QuoteSnapshot;
}

function toIsoString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toNullableIsoString(value: Date | string | null): string | null {
  return value === null ? null : toIsoString(value);
}

function toNullableNumber(value: string | number | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getInitialBitrix24SyncStatus(): Bitrix24SyncStatus {
  if (
    process.env.BITRIX24_ENABLED === "true" &&
    process.env.CALCULATOR_INQUIRY_REPOSITORY === "database"
  ) {
    return "pending";
  }

  return "not_configured";
}

function getInitialNotificationStatus(): string {
  const mode = process.env.CALCULATOR_INQUIRY_NOTIFICATIONS ?? "console";

  if (mode === "disabled") {
    return "disabled";
  }

  return "pending";
}
