create table if not exists public.message_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  acknowledged_at timestamptz default now(),
  unique (message_id, user_id)
);

create index if not exists idx_departments_organization_id on public.departments(organization_id);
create index if not exists idx_organization_members_department_id on public.organization_members(department_id);
create index if not exists idx_chats_department_id on public.chats(department_id);
create index if not exists idx_message_acknowledgements_message_id on public.message_acknowledgements(message_id);
create index if not exists idx_message_acknowledgements_user_id on public.message_acknowledgements(user_id);

alter table public.departments enable row level security;
alter table public.message_acknowledgements enable row level security;
