drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications
  for select
  using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members can create notifications for own organization" on public.notifications;
create policy "Members can create notifications for own organization"
  on public.notifications
  for insert
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1
      from public.chats c
      where c.id = notifications.chat_id
        and c.organization_id = notifications.organization_id
    )
  );
