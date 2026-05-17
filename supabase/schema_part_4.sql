drop policy if exists "Users can read their chats" on public.chats;
create policy "Users can read their chats"
  on public.chats
  for select
  using (public.is_chat_member(id));

drop policy if exists "Organization members can read organization chats" on public.chats;
create policy "Organization members can read organization chats"
  on public.chats
  for select
  using (public.is_org_member(organization_id));

drop policy if exists "Organization owners can create chats" on public.chats;
create policy "Organization owners can create chats"
  on public.chats
  for insert
  with check (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = chats.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

drop policy if exists "Users can read own chat memberships" on public.chat_members;
create policy "Users can read own chat memberships"
  on public.chat_members
  for select
  using (public.is_chat_member(chat_id));

drop policy if exists "Users can add self to chats in own organizations" on public.chat_members;
create policy "Users can add self to chats in own organizations"
  on public.chat_members
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.chats c
      join public.organization_members om on om.organization_id = c.organization_id
      where c.id = chat_members.chat_id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read messages from own chats" on public.messages;
create policy "Users can read messages from own chats"
  on public.messages
  for select
  using (public.is_chat_member(chat_id));

drop policy if exists "Users can send messages to own chats" on public.messages;
create policy "Users can send messages to own chats"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and public.is_chat_member(chat_id)
  );
