create table if not exists calculator_inquiries (
  id text primary key,

  source text not null default 'calculator',
  status text not null default 'new',

  created_at timestamptz not null,
  received_at timestamptz not null,

  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_message text not null default '',

  quote_total_gross numeric(12, 2) not null default 0,
  quote_snapshot jsonb not null,

  bitrix24_sync_status text not null default 'not_configured',
  bitrix24_deal_id bigint,
  bitrix24_error text,

  notification_status text not null default 'disabled',
  notification_error text,

  created_in_database_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint calculator_inquiries_status_check
    check (status in ('new', 'contacted', 'quoted', 'won', 'lost')),

  constraint calculator_inquiries_bitrix24_sync_status_check
    check (bitrix24_sync_status in ('not_configured', 'pending', 'sent', 'failed')),

  constraint calculator_inquiries_notification_status_check
    check (notification_status in ('disabled', 'pending', 'sent', 'failed'))
);

create index if not exists calculator_inquiries_received_at_idx
  on calculator_inquiries (received_at desc);

create index if not exists calculator_inquiries_status_idx
  on calculator_inquiries (status);

create index if not exists calculator_inquiries_customer_email_idx
  on calculator_inquiries (customer_email);

create index if not exists calculator_inquiries_customer_phone_idx
  on calculator_inquiries (customer_phone);

create index if not exists calculator_inquiries_quote_snapshot_gin_idx
  on calculator_inquiries using gin (quote_snapshot);

create or replace function set_calculator_inquiries_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists calculator_inquiries_set_updated_at on calculator_inquiries;

create trigger calculator_inquiries_set_updated_at
before update on calculator_inquiries
for each row
execute function set_calculator_inquiries_updated_at();