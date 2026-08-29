-- =====================================================================
-- PawHomie — payment tracking on bookings
-- Run in Supabase → SQL Editor.
-- =====================================================================

-- Stripe PaymentIntent id (so we can capture/cancel later)
alter table bookings add column if not exists payment_intent_id text;

-- payment lifecycle: none | held | paid | refunded | failed
alter table bookings add column if not exists payment_status text not null default 'none';

-- when the funds were captured/released to the platform
alter table bookings add column if not exists paid_at timestamptz;
