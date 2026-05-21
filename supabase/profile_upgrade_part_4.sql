drop policy if exists "Public can read avatars" on storage.objects;
create policy "Public can read avatars"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatars" on storage.objects;
create policy "Users can upload own avatars"
  on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
