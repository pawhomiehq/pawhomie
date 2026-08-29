-- =====================================================================
-- PawHomie — extra pet details (care flags + notes already exist)
-- Run once in Supabase → SQL Editor.
-- =====================================================================
alter table pets add column if not exists friendly_with_pets boolean not null default true;
alter table pets add column if not exists needs_medication   boolean not null default false;
alter table pets add column if not exists microchipped       boolean not null default false;
