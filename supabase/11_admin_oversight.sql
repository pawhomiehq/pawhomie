-- =====================================================================
-- PawHomie — admin oversight access
-- Run once in Supabase → SQL Editor.
-- Lets the admin (Bilal) read all bookings, reviews and newsletter signups,
-- and remove abusive reviews.
-- =====================================================================

-- helper: is the current user an admin?
-- (used inline below so we don't need a function)

-- bookings: admin can read all
drop policy if exists "admin reads all bookings" on bookings;
create policy "admin reads all bookings" on bookings for select
  using ( is_admin() );

-- reviews: admin can read all + delete abusive ones
drop policy if exists "admin reads all reviews" on reviews;
create policy "admin reads all reviews" on reviews for select
  using ( is_admin() );

drop policy if exists "admin removes reviews" on reviews;
create policy "admin removes reviews" on reviews for delete
  using ( is_admin() );

-- newsletter: admin can read the waitlist (visitors can still only insert)
drop policy if exists "admin reads newsletter" on newsletter;
create policy "admin reads newsletter" on newsletter for select
  using ( is_admin() );
