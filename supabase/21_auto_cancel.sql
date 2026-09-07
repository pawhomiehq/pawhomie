-- =====================================================================
-- PawHomie — 48-hour auto-cancel for unpaid/stale bookings
-- Run in Supabase → SQL Editor.
--
-- Cancels any booking still 'pending' with no payment held after 48 hours,
-- so it stops blocking the sitter and the owner sees it clearly closed.
-- Runs automatically every hour via pg_cron.
-- =====================================================================

-- 1) Enable the scheduler extension (safe if already on).
create extension if not exists pg_cron;

-- 2) The function that does the cancelling.
create or replace function auto_cancel_stale_bookings()
returns void
language sql
security definer
set search_path = public
as $$
  update bookings
  set status = 'cancelled'
  where status = 'pending'
    and coalesce(payment_status, 'none') = 'none'
    and created_at < now() - interval '48 hours';
$$;

-- 3) Schedule it to run at the top of every hour.
--    (Unschedule first so re-running this file doesn't create duplicates.)
do $$
declare jid int;
begin
  for jid in select jobid from cron.job where jobname = 'pawhomie_auto_cancel' loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'pawhomie_auto_cancel',
  '0 * * * *',                       -- every hour, on the hour
  $$ select auto_cancel_stale_bookings(); $$
);

-- To check it's scheduled:   select * from cron.job;
-- To run it right now once:  select auto_cancel_stale_bookings();
