-- =====================================================================
-- PawHomie — lock down personal data (phone, address, ID docs, Stripe id)
-- ---------------------------------------------------------------------
-- Problem: any logged-in user (or anyone with the public anon key) could read
-- EVERY user's phone number and every sitter's address / Stripe id, because the
-- "readable" policies expose all columns.
--
-- Fix: remove those sensitive COLUMNS from ordinary reads, and serve them only
-- through security-definer functions — your own data to you, and the review
-- queue to admins. Public listings (the sitter_cards view) are unaffected.
--
-- Run once in Supabase → SQL Editor. Deploy the matching app code at the same
-- time (data.js switches these reads to the functions below).
-- To roll back, see the GRANT lines at the very bottom (commented out).
-- =====================================================================

-- 1) Hide the sensitive columns from anon + any logged-in user.
revoke select (phone, id_document, id_status, id_submitted_at) on profiles      from anon, authenticated;
revoke select (phone, address, address_parts, documents, stripe_account_id) on sitter_profiles from anon, authenticated;

-- 2) Your own full profile (includes your own phone + ID status).
create or replace function my_profile()
returns json language sql security definer set search_path = public as $$
  select to_json(p) from profiles p where p.id = auth.uid();
$$;

-- 3) Your own sitter application (includes your own phone/address/documents).
create or replace function my_sitter_application()
returns json language sql security definer set search_path = public as $$
  select to_json(sp) from sitter_profiles sp where sp.profile_id = auth.uid();
$$;

-- 4) Admin review queue — owner ID verifications (admins only; empty otherwise).
create or replace function admin_owner_applicants(which text default 'all')
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(r order by r.id_submitted_at), '[]'::json)
  from (
    select id, full_name, initial, avatar_gold, city, id_status, id_document, id_submitted_at
    from profiles
    where is_admin()
      and id_status <> 'unverified'
      and (which = 'all' or id_status = which)
  ) r;
$$;

-- 5) Admin review queue — sitter applications (admins only; empty otherwise).
create or replace function admin_sitter_applicants(which text default 'all')
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(r order by r.applied_at), '[]'::json)
  from (
    select sp.id, sp.status, sp.quiz_score, sp.quiz_passed, sp.about, sp.rate_per_night,
           sp.applied_at, sp.phone, sp.address, sp.home_type, sp.has_yard, sp.documents,
           json_build_object('full_name', p.full_name, 'initial', p.initial,
                             'avatar_gold', p.avatar_gold, 'city', p.city) as profile
    from sitter_profiles sp
    join profiles p on p.id = sp.profile_id
    where is_admin()
      and (which = 'all' or sp.status = which)
  ) r;
$$;

grant execute on function my_profile()                     to authenticated;
grant execute on function my_sitter_application()          to authenticated;
grant execute on function admin_owner_applicants(text)     to authenticated;
grant execute on function admin_sitter_applicants(text)    to authenticated;

-- ---------------------------------------------------------------------
-- ROLLBACK (only if a read breaks and you need to undo quickly):
-- grant select (phone, id_document, id_status, id_submitted_at) on profiles to anon, authenticated;
-- grant select (phone, address, address_parts, documents, stripe_account_id) on sitter_profiles to anon, authenticated;
-- ---------------------------------------------------------------------
