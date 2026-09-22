-- =====================================================================
-- PawHomie — richer profiles (phone, bio) for owners & sitters
-- Run in Supabase → SQL Editor.
-- =====================================================================

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists bio   text;

-- Pet profile photo
alter table pets add column if not exists photo_url text;
