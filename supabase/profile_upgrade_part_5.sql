drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
  on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars"
  on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
