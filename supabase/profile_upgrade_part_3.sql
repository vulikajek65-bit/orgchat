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
