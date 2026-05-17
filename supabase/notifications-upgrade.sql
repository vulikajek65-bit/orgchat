-- Выполнить в Supabase SQL Editor после organization-upgrade.sql.

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

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  type text not null check (type in ('message', 'urgent_message', 'announcement', 'task', 'system')),
  title text not null,
  body text,
  is_read boolean default false,
  is_silent boolean default false,
  scheduled_for timestamptz,
  created_at timestamptz default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_organization_id_idx on public.notifications(organization_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);
create index if not exists notifications_scheduled_for_idx on public.notifications(scheduled_for);

alter table public.notifications enable row level security;

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.organization_members;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications
  for select
  using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members can create notifications for own organization" on public.notifications;
create policy "Members can create notifications for own organization"
  on public.notifications
  for insert
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1
      from public.chats c
      where c.id = notifications.chat_id
        and c.organization_id = notifications.organization_id
    )
  );

drop policy if exists "Users can update own status" on public.organization_members;
create policy "Users can update own status"
  on public.organization_members
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can update own scheduled messages" on public.messages;
create policy "Users can update own scheduled messages"
  on public.messages
  for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "Users can read messages from own chats" on public.messages;
create policy "Users can read delivered messages or own scheduled messages"
  on public.messages
  for select
  using (
    public.is_chat_member(chat_id)
    and (is_delivered = true or sender_id = auth.uid())
  );

-- TODO: публикацию notifications и автоматическую доставку next_shift в продакшене
-- и автоматическую доставку next_shift в продакшене вынести
-- в отдельную миграцию и Supabase Edge Function + cron.
