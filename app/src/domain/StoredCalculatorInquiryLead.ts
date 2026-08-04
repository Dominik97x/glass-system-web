import type { CalculatorInquiryLead } from "./CalculatorInquiryLead";

export type CalculatorInquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "won"
  | "lost";

export type Bitrix24SyncStatus =
  | "not_configured"
  | "pending"
  | "processing"
  | "synced"
  | "failed";

export interface Bitrix24SyncState {
  status: Bitrix24SyncStatus;
  contactId: number | null;
  dealId: number | null;
  attempts: number;
  lastError: string | null;
  lastAttemptAt: string | null;
  startedAt: string | null;
  syncedAt: string | null;
  nextRetryAt: string | null;
}

export interface StoredCalculatorInquiryLead extends CalculatorInquiryLead {
  id: string;
  status: CalculatorInquiryStatus;
  receivedAt: string;
  bitrix24?: Bitrix24SyncState;
}
