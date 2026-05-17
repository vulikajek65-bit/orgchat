create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.organization_members
  add column if not exists department_id uuid references public.departments(id) on delete set null;

alter table public.chats
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists description text;

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner', 'admin', 'manager', 'employee'));

alter table public.chats
  drop constraint if exists chats_type_check;

alter table public.chats
  add constraint chats_type_check
  check (type in ('general', 'department', 'direct', 'project', 'urgent', 'announcement'));
