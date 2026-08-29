-- =====================================================================
-- PawHomie — CLEAN seed (sitters only)
--
-- Use this INSTEAD of 02_seed.sql if you want browsable Paw Homies in
-- search WITHOUT any fake bookings, messages, notifications or reviews
-- cluttering a real test account.
--
-- Still create these users first in Authentication → Users (Auto Confirm):
--   sara@demo.pawhomie.com
--   daniel@demo.pawhomie.com
--   priya@demo.pawhomie.com
--   marco@demo.pawhomie.com
-- (You do NOT need the aisha@ owner account for this clean version —
--  sign up as yourself and test with a real account.)
-- =====================================================================

update profiles p set full_name = v.name, avatar_gold = v.gold, is_sitter = true, is_owner = false
from (values
  ('sara@demo.pawhomie.com',   'Sara M.',   false),
  ('daniel@demo.pawhomie.com', 'Daniel K.', true),
  ('priya@demo.pawhomie.com',  'Priya R.',  false),
  ('marco@demo.pawhomie.com',  'Marco B.',  true)
) as v(email, name, gold)
where p.id = (select id from auth.users u where u.email = v.email);

insert into sitter_profiles (profile_id, about, rate_per_night, reply_time, tags, lat, lng, verified, published)
select u.id, v.about, v.rate, v.reply, v.tags, v.lat, v.lng, true, true
from (values
  ('sara@demo.pawhomie.com',
   'Dog lover with 6 years of sitting experience. Lots of walks, cuddles, and daily photo updates so you can relax while you''re away.',
   42, 'Replies in 1 hr',   array['Fenced yard','Ok with other pets','Garden'], 43.6532, -79.3832),
  ('daniel@demo.pawhomie.com',
   'Calm, reliable carer who treats every pet like a guest of honour.',
   38, 'Replies in 2 hrs',  array['House with garden','Cats welcome'],          43.6620, -79.3960),
  ('priya@demo.pawhomie.com',
   'Former vet assistant — your pet is in expert, loving hands.',
   46, 'Replies in 30 min', array['Fenced yard','Daily photos'],                43.6700, -79.4100),
  ('marco@demo.pawhomie.com',
   'Energetic and playful — perfect for pups who love their zoomies.',
   35, 'Replies in 1 hr',   array['Apartment','Small dogs'],                    43.6800, -79.4200)
) as v(email, about, rate, reply, tags, lat, lng)
join auth.users u on u.email = v.email
on conflict (profile_id) do update
  set about=excluded.about, rate_per_night=excluded.rate_per_night,
      reply_time=excluded.reply_time, tags=excluded.tags, published=true, verified=true;

-- make the demo sitters fully approved so they show in search + can be messaged/booked
update sitter_profiles set status = 'approved', quiz_passed = true, quiz_score = 100
where profile_id in (select id from auth.users where email like '%@demo.pawhomie.com');

-- services each sitter offers (so the "How" filter works)
insert into services (sitter_id, kind, price, enabled)
select sp.id, 'house_sitting', sp.rate_per_night, true from sitter_profiles sp
on conflict (sitter_id, kind) do nothing;
insert into services (sitter_id, kind, price, enabled)
select sp.id, 'drop_in', 20, true from sitter_profiles sp
on conflict (sitter_id, kind) do nothing;

-- open availability for the next 30 days (weekends blocked)
insert into availability (sitter_id, day, status)
select sp.id, d::date,
       case when extract(dow from d) in (0,6) then 'blocked' else 'open' end
from sitter_profiles sp
cross join generate_series(current_date, current_date + interval '30 days', interval '1 day') d
on conflict (sitter_id, day) do nothing;

select 'published sitters' as tbl, count(*) from sitter_cards;
-- should be 4. No bookings, messages or notifications are created.
