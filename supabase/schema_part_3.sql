drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can read coworker profiles" on public.profiles;
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

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can read own organizations" on public.organizations;
create policy "Users can read own organizations"
  on public.organizations
  for select
  using (public.is_org_member(id));

drop policy if exists "Authenticated users can find organizations by invite code" on public.organizations;
create policy "Authenticated users can find organizations by invite code"
  on public.organizations
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Owners can create organizations" on public.organizations;
create policy "Owners can create organizations"
  on public.organizations
  for insert
  with check (owner_id = auth.uid());

drop policy if exists "Users can read members in own organizations" on public.organization_members;
create policy "Users can read members in own organizations"
  on public.organization_members
  for select
  using (public.is_org_member(organization_id));

drop policy if exists "Users can create own memberships" on public.organization_members;
create policy "Users can create own memberships"
  on public.organization_members
  for insert
  with check (user_id = auth.uid());
