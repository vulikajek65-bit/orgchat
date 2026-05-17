-- Выполнить в Supabase SQL Editor после базовой схемы OrgChat.

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

create or replace function public.current_org_role(target_organization_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.organization_members
  where organization_id = target_organization_id
    and user_id = auth.uid()
  limit 1;
$$;

drop policy if exists "Members can read departments" on public.departments;
create policy "Members can read departments"
  on public.departments
  for select
  using (public.is_org_member(organization_id));

drop policy if exists "Admins can create departments" on public.departments;
create policy "Admins can create departments"
  on public.departments
  for insert
  with check (public.current_org_role(organization_id) in ('owner', 'admin'));

drop policy if exists "Admins can update departments" on public.departments;
create policy "Admins can update departments"
  on public.departments
  for update
  using (public.current_org_role(organization_id) in ('owner', 'admin'))
  with check (public.current_org_role(organization_id) in ('owner', 'admin'));

drop policy if exists "Admins can delete departments" on public.departments;
create policy "Admins can delete departments"
  on public.departments
  for delete
  using (public.current_org_role(organization_id) in ('owner', 'admin'));

drop policy if exists "Admins can update members" on public.organization_members;
create policy "Admins can update members"
  on public.organization_members
  for update
  using (public.current_org_role(organization_id) in ('owner', 'admin'))
  with check (public.current_org_role(organization_id) in ('owner', 'admin'));

drop policy if exists "Managers can create allowed chats" on public.chats;
create policy "Managers can create allowed chats"
  on public.chats
  for insert
  with check (
    public.current_org_role(organization_id) in ('owner', 'admin')
    or (
      public.current_org_role(organization_id) = 'manager'
      and type in ('department', 'announcement')
    )
  );

drop policy if exists "Admins can add chat members" on public.chat_members;
create policy "Admins can add chat members"
  on public.chat_members
  for insert
  with check (
    exists (
      select 1
      from public.chats c
      where c.id = chat_members.chat_id
        and public.current_org_role(c.organization_id) in ('owner', 'admin', 'manager')
    )
  );

drop policy if exists "Members can read acknowledgements" on public.message_acknowledgements;
create policy "Members can read acknowledgements"
  on public.message_acknowledgements
  for select
  using (
    exists (
      select 1
      from public.messages m
      where m.id = message_acknowledgements.message_id
        and public.is_chat_member(m.chat_id)
    )
  );

drop policy if exists "Users can acknowledge visible messages" on public.message_acknowledgements;
create policy "Users can acknowledge visible messages"
  on public.message_acknowledgements
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.messages m
      where m.id = message_acknowledgements.message_id
        and public.is_chat_member(m.chat_id)
    )
  );

drop policy if exists "Users can send messages to own chats" on public.messages;
create policy "Users can send messages to allowed chats"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and public.is_chat_member(chat_id)
    and exists (
      select 1
      from public.chats c
      join public.organization_members om on om.organization_id = c.organization_id
      where c.id = messages.chat_id
        and om.user_id = auth.uid()
        and (
          c.type <> 'announcement'
          or om.role in ('owner', 'admin', 'manager')
        )
    )
  );
