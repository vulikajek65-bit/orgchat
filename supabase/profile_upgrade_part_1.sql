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
