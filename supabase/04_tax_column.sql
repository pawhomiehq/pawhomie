-- Adds a tax column so the recorded total matches what the customer saw.
-- Run once in Supabase → SQL Editor.
alter table bookings add column if not exists tax numeric(10,2) not null default 0;
