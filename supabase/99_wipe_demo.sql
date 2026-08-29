-- =====================================================================
-- PawHomie — WIPE DEMO DATA
-- Run this when you want a clean slate (e.g. before real testing or launch).
-- It removes the sample bookings, messages, notifications, reviews, pets
-- and the demo sitter listings — but KEEPS the tables and your structure.
--
-- ⚠️ This deletes data. Only run it when you actually want everything gone.
-- =====================================================================

-- transactional bits first (respect foreign keys)
delete from messages;
delete from conversations;
delete from notifications;
delete from reviews;
delete from bookings;
delete from favorites;
delete from availability;
delete from services;
delete from pets;

-- demo sitter listings
delete from sitter_profiles;

-- Optional: also remove the demo *accounts* (aisha@, sara@, etc.).
-- Uncomment if you want them gone too. Leaving them is harmless.
-- delete from auth.users where email like '%@demo.pawhomie.com';

-- profiles left behind by removed auth users are cleaned by the cascade;
-- profiles for real users stay. Reset role flags on any leftover demo profiles:
update profiles set is_sitter = false
where id in (select id from auth.users where email like '%@demo.pawhomie.com');

select 'sitter_profiles' as tbl, count(*) from sitter_profiles
union all select 'bookings', count(*) from bookings
union all select 'messages', count(*) from messages
union all select 'notifications', count(*) from notifications
union all select 'pets', count(*) from pets;
-- all should be 0 (except any real data you created yourself)
