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
