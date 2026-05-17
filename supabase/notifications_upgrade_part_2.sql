alter table public.messages
  drop constraint if exists messages_urgent_reason_check;

alter table public.messages
  add constraint messages_urgent_reason_check
  check (not is_urgent or nullif(trim(urgent_reason), '') is not null);

alter table public.organization_members
  add column if not exists availability_status text default 'auto',
  add column if not exists status_until timestamptz;

alter table public.organization_members
  drop constraint if exists organization_members_availability_status_check;

alter table public.organization_members
  add constraint organization_members_availability_status_check
  check (availability_status in ('auto', 'working', 'break', 'busy', 'off', 'vacation'));
