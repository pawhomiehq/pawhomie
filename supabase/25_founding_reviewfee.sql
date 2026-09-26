-- =====================================================================
-- PawHomie — founding sitters, review fee, loyalty (Bilal's fee spec)
-- Run in Supabase → SQL Editor.
-- =====================================================================

-- Founding: first 200 sitters per city keep 88% (12% fee) + waived review fee.
alter table sitter_profiles add column if not exists is_founding boolean not null default false;

-- Review fee lifecycle: 'due' (owes $29) | 'waived' (founding) | 'paid' | 'refunded'
alter table sitter_profiles add column if not exists review_fee_status text not null default 'due';

-- The Stripe payment intent for the review fee (so we can refund it later).
alter table sitter_profiles add column if not exists review_fee_intent text;
