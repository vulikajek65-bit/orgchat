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
