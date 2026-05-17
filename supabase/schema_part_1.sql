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
