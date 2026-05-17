drop policy if exists "Users can send messages to own chats" on public.messages;
drop policy if exists "Users can send messages to allowed chats" on public.messages;
create policy "Users can send messages to allowed chats"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and public.is_chat_member(chat_id)
    and exists (
      select 1
      from public.chats c
      join public.organization_members om on om.organization_id = c.organization_id
      where c.id = messages.chat_id
        and om.user_id = auth.uid()
        and (
          c.type <> 'announcement'
          or om.role in ('owner', 'admin', 'manager')
        )
    )
  );
