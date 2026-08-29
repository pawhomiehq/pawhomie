-- =====================================================================
-- PawHomie — FIX "infinite recursion detected in policy for profiles"
-- Run this in Supabase → SQL Editor.
--
-- Cause: admin policies checked is_admin by selecting FROM profiles,
-- which re-ran the profiles policy → infinite loop, so NO profile could
-- be read (login failed after auth).
--
-- Fix: a SECURITY DEFINER function that checks admin WITHOUT triggering
-- RLS, and rewrite every admin policy to call it.
-- =====================================================================

create or replace function is_admin()
returns boolean
language sql
security definer            -- runs as owner, bypasses RLS → no recursion
stable
set search_path = public
as $$
  select coalesce((select p.is_admin from profiles p where p.id = auth.uid()), false);
$$;

-- ---- profiles ----
drop policy if exists "admin reads all profiles" on profiles;
create policy "admin reads all profiles" on profiles for select using ( is_admin() );

drop policy if exists "admin updates profiles" on profiles;
create policy "admin updates profiles" on profiles for update using ( is_admin() );

-- ---- sitter_profiles ----
drop policy if exists "admin reads all sitters" on sitter_profiles;
create policy "admin reads all sitters" on sitter_profiles for select using ( is_admin() );

drop policy if exists "admin reviews sitters" on sitter_profiles;
create policy "admin reviews sitters" on sitter_profiles for update using ( is_admin() );

-- ---- bookings ----
drop policy if exists "admin reads all bookings" on bookings;
create policy "admin reads all bookings" on bookings for select using ( is_admin() );

-- ---- reviews ----
drop policy if exists "admin reads all reviews" on reviews;
create policy "admin reads all reviews" on reviews for select using ( is_admin() );

drop policy if exists "admin removes reviews" on reviews;
create policy "admin removes reviews" on reviews for delete using ( is_admin() );

-- ---- newsletter ----
drop policy if exists "admin reads newsletter" on newsletter;
create policy "admin reads newsletter" on newsletter for select using ( is_admin() );

-- ---- storage (sitter-docs / owner-docs admin read) ----
drop policy if exists "read own or admin docs" on storage.objects;
create policy "read own or admin docs" on storage.objects for select to authenticated
  using ( bucket_id = 'sitter-docs' and ( (storage.foldername(name))[1] = auth.uid()::text or is_admin() ) );

drop policy if exists "owner read own or admin docs" on storage.objects;
create policy "owner read own or admin docs" on storage.objects for select to authenticated
  using ( bucket_id = 'owner-docs' and ( (storage.foldername(name))[1] = auth.uid()::text or is_admin() ) );
