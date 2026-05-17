drop policy if exists "Members can read acknowledgements" on public.message_acknowledgements;
create policy "Members can read acknowledgements"
  on public.message_acknowledgements
  for select
  using (
    exists (
      select 1
      from public.messages m
      where m.id = message_acknowledgements.message_id
        and public.is_chat_member(m.chat_id)
    )
  );

drop policy if exists "Users can acknowledge visible messages" on public.message_acknowledgements;
create policy "Users can acknowledge visible messages"
  on public.message_acknowledgements
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.messages m
      where m.id = message_acknowledgements.message_id
        and public.is_chat_member(m.chat_id)
    )
  );
