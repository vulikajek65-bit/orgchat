-- Выполнить в Supabase SQL Editor после profile-upgrade.sql.

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  uploader_id uuid references public.profiles(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_url text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  kind text not null check (kind in ('image', 'video', 'audio', 'document', 'file')),
  duration_seconds numeric,
  created_at timestamptz default now()
);

create index if not exists message_attachments_message_id_idx on public.message_attachments(message_id);
create index if not exists message_attachments_chat_id_idx on public.message_attachments(chat_id);
create index if not exists message_attachments_uploader_id_idx on public.message_attachments(uploader_id);

alter table public.message_attachments enable row level security;

drop policy if exists "Members can read chat attachments" on public.message_attachments;
create policy "Members can read chat attachments"
  on public.message_attachments
  for select
  using (public.is_chat_member(chat_id));

drop policy if exists "Members can create chat attachments" on public.message_attachments;
create policy "Members can create chat attachments"
  on public.message_attachments
  for insert
  with check (
    uploader_id = auth.uid()
    and public.is_chat_member(chat_id)
    and exists (
      select 1 from public.messages m
      where m.id = message_attachments.message_id
        and m.chat_id = message_attachments.chat_id
        and m.sender_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Members can read message attachment files" on storage.objects;
create policy "Members can read message attachment files"
  on storage.objects
  for select
  using (bucket_id = 'message-attachments');

drop policy if exists "Users can upload message attachment files" on storage.objects;
create policy "Users can upload message attachment files"
  on storage.objects
  for insert
  with check (
    bucket_id = 'message-attachments'
    and split_part(name, '/', 1) = auth.uid()::text
  );

do $$
begin
  alter publication supabase_realtime add table public.message_attachments;
exception
  when duplicate_object then null;
end $$;
