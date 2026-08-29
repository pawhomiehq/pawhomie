-- =====================================================================
-- PawHomie — owner ID verification + pet vaccination records
-- Run once in Supabase → SQL Editor.
-- =====================================================================

-- owner identity verification (on the profile)
alter table profiles add column if not exists id_document     text;      -- storage path
alter table profiles add column if not exists id_status       text not null default 'unverified';
  -- unverified = never submitted
  -- pending    = uploaded, waiting for admin
  -- verified   = admin approved
  -- rejected   = admin rejected
alter table profiles add column if not exists id_submitted_at timestamptz;

-- pet vaccination records (on each pet)
alter table pets add column if not exists vaccination_doc    text;       -- storage path
alter table pets add column if not exists vaccination_status text not null default 'none';
  -- none = not uploaded, on_file = uploaded
alter table pets add column if not exists vaccination_note   text;       -- e.g. "Rabies exp. 2027"

-- =====================================================================
-- STORAGE bucket for owner documents (private)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('owner-docs', 'owner-docs', false)
on conflict (id) do nothing;

-- files live under {auth.uid()}/... e.g. {uid}/id.jpg, {uid}/pet-<petId>-vax.jpg
drop policy if exists "owner upload own docs" on storage.objects;
create policy "owner upload own docs" on storage.objects for insert to authenticated
  with check ( bucket_id = 'owner-docs' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "owner update own docs" on storage.objects;
create policy "owner update own docs" on storage.objects for update to authenticated
  using ( bucket_id = 'owner-docs' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "owner read own or admin docs" on storage.objects;
create policy "owner read own or admin docs" on storage.objects for select to authenticated
  using (
    bucket_id = 'owner-docs' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

-- admin can update any profile's id_status (approve/reject) — profiles already
-- has an admin update path from 10_quiz_admin? No: that was for sitter_profiles.
-- Add an admin update policy on profiles here.
drop policy if exists "admin updates profiles" on profiles;
create policy "admin updates profiles" on profiles for update
  using ( is_admin() );
