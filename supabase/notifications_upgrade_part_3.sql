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
