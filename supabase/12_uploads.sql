-- =====================================================================
-- PawHomie — sitter application documents & details
-- Run once in Supabase → SQL Editor.
-- =====================================================================

-- extra application details on the sitter profile
alter table sitter_profiles add column if not exists phone     text;
alter table sitter_profiles add column if not exists address   text;
alter table sitter_profiles add column if not exists home_type text;      -- House / Apartment / Condo / Townhouse
alter table sitter_profiles add column if not exists has_yard  boolean not null default false;
-- document storage paths, keyed by kind: { "id": "...", "selfie": "...", "home": "...", "yard": "..." }
alter table sitter_profiles add column if not exists documents jsonb not null default '{}'::jsonb;

-- =====================================================================
-- STORAGE bucket for the documents (private)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('sitter-docs', 'sitter-docs', false)
on conflict (id) do nothing;

-- Files live under a folder named after the uploader's auth id:
--   {auth.uid()}/self.jpg, {auth.uid()}/id.jpg, {auth.uid()}/home-1.jpg ...

-- sitter can upload into their own folder
drop policy if exists "upload own docs" on storage.objects;
create policy "upload own docs" on storage.objects for insert to authenticated
  with check ( bucket_id = 'sitter-docs' and (storage.foldername(name))[1] = auth.uid()::text );

-- sitter can replace their own files (upsert)
drop policy if exists "update own docs" on storage.objects;
create policy "update own docs" on storage.objects for update to authenticated
  using ( bucket_id = 'sitter-docs' and (storage.foldername(name))[1] = auth.uid()::text );

-- sitter reads their own; admin reads everyone's (for review)
drop policy if exists "read own or admin docs" on storage.objects;
create policy "read own or admin docs" on storage.objects for select to authenticated
  using (
    bucket_id = 'sitter-docs' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );
