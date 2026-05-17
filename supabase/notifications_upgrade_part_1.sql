alter table public.messages
  add column if not exists urgent_reason text,
  add column if not exists delivery_mode text default 'now',
  add column if not exists scheduled_for timestamptz,
  add column if not exists is_delivered boolean default true;

alter table public.messages
  drop constraint if exists messages_delivery_mode_check;

alter table public.messages
  add constraint messages_delivery_mode_check
  check (delivery_mode in ('now', 'next_shift'));
