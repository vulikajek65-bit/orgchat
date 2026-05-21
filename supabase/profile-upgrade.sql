-- Выполнить в Supabase SQL Editor после notifications-upgrade.sql.

alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists personal_status text,
  add column if not exists phone text;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create table if not exists public.user_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  contact_name text not null,
  phone text,
  email text,
  linked_profile_id uuid references public.profiles(id) on delete set null,
  source text default 'manual',
  created_at timestamptz default now()
);

create index if not exists user_contacts_owner_id_idx on public.user_contacts(owner_id);
create index if not exists user_contacts_organization_id_idx on public.user_contacts(organization_id);
create index if not exists user_contacts_linked_profile_id_idx on public.user_contacts(linked_profile_id);

alter table public.user_contacts enable row level security;

drop policy if exists "Users can manage own contacts" on public.user_contacts;
create policy "Users can manage own contacts"
  on public.user_contacts
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read avatars" on storage.objects;
create policy "Public can read avatars"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatars" on storage.objects;
create policy "Users can upload own avatars"
  on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
  on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars"
  on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
