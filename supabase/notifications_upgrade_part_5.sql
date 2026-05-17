drop policy if exists "Users can update own status" on public.organization_members;
create policy "Users can update own status"
  on public.organization_members
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can update own scheduled messages" on public.messages;
create policy "Users can update own scheduled messages"
  on public.messages
  for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "Users can read messages from own chats" on public.messages;
create policy "Users can read delivered messages or own scheduled messages"
  on public.messages
  for select
  using (
    public.is_chat_member(chat_id)
    and (is_delivered = true or sender_id = auth.uid())
  );
