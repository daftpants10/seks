insert into storage.buckets (id, name, public) values ('posts', 'posts', true);
create policy "Anyone can read audio" on storage.objects for select using (bucket_id = 'posts');
create policy "Auth users upload" on storage.objects for insert with check (bucket_id = 'posts' and auth.role() = 'authenticated');
