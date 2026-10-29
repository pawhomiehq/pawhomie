-- ====================================================================
-- 29_backfill_founding.sql
-- Founding status is now granted when someone BECOMES a Paw Homie.
-- This backfills existing Paw Homies who joined before that change, so
-- accounts created earlier (e.g. during testing) also keep 90% (10% fee).
-- Respects the 100-spot cap: the earliest 100 sitters get founding.
-- Safe to re-run.
-- ====================================================================
with ranked as (
  select id,
         row_number() over (order by coalesce(applied_at, now())) as rn
    from sitter_profiles
   where coalesce(is_founding, false) = false
)
update sitter_profiles sp
   set is_founding = true,
       review_fee_status = 'waived'
  from ranked r
 where sp.id = r.id
   and r.rn <= greatest(0, 100 - (select count(*) from sitter_profiles where is_founding = true));
