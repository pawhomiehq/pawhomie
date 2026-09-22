-- =====================================================================
-- PawHomie — structured Canadian address (Tier 4)
-- Run in Supabase → SQL Editor.
-- =====================================================================

-- Structured address {unit, street, city, province, postal} on sitter profiles.
alter table sitter_profiles add column if not exists address_parts jsonb;

-- Sitter home/space photos (array of public URLs).
alter table sitter_profiles add column if not exists home_photos jsonb not null default '[]'::jsonb;
