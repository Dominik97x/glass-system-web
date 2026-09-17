begin;

alter table calculator_inquiries
  add column if not exists bitrix24_contact_id bigint,
  add column if not exists bitrix24_sync_attempts integer not null default 0,
  add column if not exists bitrix24_last_attempt_at timestamptz,
  add column if not exists bitrix24_sync_started_at timestamptz,
  add column if not exists bitrix24_synced_at timestamptz,
  add column if not exists bitrix24_next_retry_at timestamptz;

update calculator_inquiries
set bitrix24_sync_status = 'synced'
where bitrix24_sync_status = 'sent';

alter table calculator_inquiries
  drop constraint if exists calculator_inquiries_bitrix24_sync_status_check;

alter table calculator_inquiries
  add constraint calculator_inquiries_bitrix24_sync_status_check
  check (
    bitrix24_sync_status in (
      'not_configured',
      'pending',
      'processing',
      'synced',
      'failed'
    )
  );

alter table calculator_inquiries
  drop constraint if exists calculator_inquiries_bitrix24_sync_attempts_check;

alter table calculator_inquiries
  add constraint calculator_inquiries_bitrix24_sync_attempts_check
  check (bitrix24_sync_attempts >= 0);

create index if not exists calculator_inquiries_bitrix24_sync_queue_idx
  on calculator_inquiries (bitrix24_sync_status, bitrix24_next_retry_at, received_at)
  where bitrix24_sync_status in ('pending', 'failed', 'processing');

create index if not exists calculator_inquiries_bitrix24_deal_id_idx
  on calculator_inquiries (bitrix24_deal_id)
  where bitrix24_deal_id is not null;

commit;
