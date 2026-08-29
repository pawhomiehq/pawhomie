-- =====================================================================
-- PawHomie — FIX LOGIN ("please log in to continue")
-- Run this in Supabase → SQL Editor.
--
-- Cause: accounts created before the auto-profile trigger existed have no
-- row in `profiles`, so the app can't load them and treats them as guests.
--
-- This backfills the missing rows and lets a signed-in user create their
-- own profile row if one is ever missing.
-- =====================================================================

-- 1) Backfill: create a profile for every auth user that doesn't have one.
--    (`initial` is a generated column — never insert it, Postgres computes it.)
insert into profiles (id, full_name, is_owner, is_sitter, is_admin)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  true, false, false
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;

-- 2) Let a signed-in user insert their OWN profile row (safety net used by the app).
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert to authenticated
  with check ( auth.uid() = id );

-- 3) Make sure the auto-create trigger is in place for future signups.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Check: this should return 0 (every auth user now has a profile)
select count(*) as users_without_profile
from auth.users u left join profiles p on p.id = u.id
where p.id is null;
