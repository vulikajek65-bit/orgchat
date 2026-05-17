create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade,
  invite_code text unique not null,
  default_work_start time default '09:00',
  default_work_end time default '17:00',
  created_at timestamptz default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'employee')),
  position text,
  work_start time default '09:00',
  work_end time default '17:00',
  created_at timestamptz default now(),
  unique (organization_id, user_id)
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  type text not null check (type in ('general', 'department', 'direct', 'announcement')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.chat_members (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (chat_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  is_urgent boolean default false,
  created_at timestamptz default now()
);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end
$$;

create index if not exists idx_organization_members_user_id on public.organization_members(user_id);
create index if not exists idx_chats_organization_id on public.chats(organization_id);
create index if not exists idx_chat_members_user_id on public.chat_members(user_id);
create index if not exists idx_messages_chat_id_created_at on public.messages(chat_id, created_at);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_chat_member(target_chat_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.chat_members
    where chat_id = target_chat_id
      and user_id = auth.uid()
  );
$$;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can read coworker profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.organization_members om
      where om.user_id = profiles.id
        and public.is_org_member(om.organization_id)
    )
  );

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can read own organizations"
  on public.organizations
  for select
  using (public.is_org_member(id));

create policy "Authenticated users can find organizations by invite code"
  on public.organizations
  for select
  using (auth.role() = 'authenticated');

create policy "Owners can create organizations"
  on public.organizations
  for insert
  with check (owner_id = auth.uid());

create policy "Users can read members in own organizations"
  on public.organization_members
  for select
  using (public.is_org_member(organization_id));

create policy "Users can create own memberships"
  on public.organization_members
  for insert
  with check (user_id = auth.uid());

create policy "Users can read their chats"
  on public.chats
  for select
  using (public.is_chat_member(id));

create policy "Organization members can read organization chats"
  on public.chats
  for select
  using (public.is_org_member(organization_id));

create policy "Organization owners can create chats"
  on public.chats
  for insert
  with check (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = chats.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

create policy "Users can read own chat memberships"
  on public.chat_members
  for select
  using (public.is_chat_member(chat_id));

create policy "Users can add self to chats in own organizations"
  on public.chat_members
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.chats c
      join public.organization_members om on om.organization_id = c.organization_id
      where c.id = chat_members.chat_id
        and om.user_id = auth.uid()
    )
  );

create policy "Users can read messages from own chats"
  on public.messages
  for select
  using (public.is_chat_member(chat_id));

create policy "Users can send messages to own chats"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and public.is_chat_member(chat_id)
  );

-- TODO(next step): добавить политики обновления профиля, управления участниками и админские сценарии.
