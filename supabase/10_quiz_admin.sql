-- =====================================================================
-- PawHomie — quiz score + admin approval
-- Run once in Supabase → SQL Editor.
-- =====================================================================

-- quiz + application state on each sitter
-- helper: admin check that does NOT trigger RLS recursion
create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select p.is_admin from profiles p where p.id = auth.uid()), false);
$$;

alter table sitter_profiles add column if not exists quiz_score  int;         -- 0..100 (percent), null = not taken
alter table sitter_profiles add column if not exists quiz_passed boolean not null default false;
alter table sitter_profiles add column if not exists status      text    not null default 'draft';
  -- draft = new, hasn't applied
  -- pending = passed quiz + applied, waiting for admin
  -- approved = admin approved (can appear in search)
  -- rejected = admin rejected
alter table sitter_profiles add column if not exists applied_at   timestamptz;
alter table sitter_profiles add column if not exists reviewed_at  timestamptz;

-- A sitter only appears in search when APPROVED *and* published.
drop view if exists sitter_cards;
create view sitter_cards as
select
  sp.id,
  p.full_name                                as name,
  p.initial,
  p.avatar_gold                              as gold,
  p.city                                     as city,
  sp.rate_per_night                          as rate,
  coalesce(round(avg(r.rating)::numeric, 1), 5.0) as rating,
  count(r.id)                                as reviews,
  sp.tags,
  sp.reply_time                              as reply,
  sp.about,
  sp.verified,
  sp.quiz_score,
  sp.lat,
  sp.lng
from sitter_profiles sp
join profiles p on p.id = sp.profile_id
left join reviews r on r.sitter_id = sp.id
where sp.published = true
  and sp.status = 'approved'
group by sp.id, p.full_name, p.initial, p.avatar_gold, p.city, sp.quiz_score;

-- Admin needs to read every sitter_profile (to review applicants).
-- Owners already can't; this adds an admin-only read path.
drop policy if exists "admin reads all sitters" on sitter_profiles;
create policy "admin reads all sitters" on sitter_profiles for select
  using ( is_admin() );

-- Admin needs to update status (approve/reject).
drop policy if exists "admin reviews sitters" on sitter_profiles;
create policy "admin reviews sitters" on sitter_profiles for update
  using ( is_admin() );

-- Admin needs to read every profile (names for the review queue).
drop policy if exists "admin reads all profiles" on profiles;
create policy "admin reads all profiles" on profiles for select
  using ( is_admin() );

-- If you already seeded demo sitters, approve them so they still show in search:
update sitter_profiles set status = 'approved', quiz_passed = true, quiz_score = 100
where status = 'draft';
