-- =====================================================================
-- PawHomie — Stripe Connect (sitter payouts)
-- Run in Supabase → SQL Editor.
-- =====================================================================

-- The sitter's connected Stripe account id (acct_...)
alter table sitter_profiles add column if not exists stripe_account_id text;

-- Whether Stripe has approved them to receive payouts (finished onboarding)
alter table sitter_profiles add column if not exists payouts_enabled boolean not null default false;
