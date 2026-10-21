-- =====================================================================
-- PawHomie — dual-role accounts
-- ---------------------------------------------------------------------
-- Every account can be a pet owner; the Paw Homie (sitter) role is added
-- on top, with its own approval. This backfills any existing sitter-only
-- accounts so they're also owners (so the "switch sides" works for them,
-- and they're never stranded on one side).
--
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- =====================================================================

update profiles
set is_owner = true
where is_sitter = true and is_owner is distinct from true;

-- New sign-ups are already created as owners by the app (setRole / signUp),
-- so no trigger is needed; this is a one-time backfill for older rows.
