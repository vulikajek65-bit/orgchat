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
