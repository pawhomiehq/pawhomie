-- =====================================================================
-- PawHomie — demo data
--
-- BEFORE RUNNING THIS:
-- Create 5 users in Supabase → Authentication → Users → "Add user"
-- (tick "Auto Confirm User" for each). Use these exact emails:
--
--   aisha@demo.pawhomie.com     (the pet owner — this is your test login)
--   sara@demo.pawhomie.com
--   daniel@demo.pawhomie.com
--   priya@demo.pawhomie.com
--   marco@demo.pawhomie.com
--
-- Any password you like (e.g. demo123456). Then run this file.
-- =====================================================================

-- ---------- name the profiles (the signup trigger already created the rows) ----------
update profiles p set full_name = v.name, avatar_gold = v.gold, is_sitter = v.sitter
from (values
  ('aisha@demo.pawhomie.com',  'Aisha K.',  true,  false),
  ('sara@demo.pawhomie.com',   'Sara M.',   false, true),
  ('daniel@demo.pawhomie.com', 'Daniel K.', true,  true),
  ('priya@demo.pawhomie.com',  'Priya R.',  false, true),
  ('marco@demo.pawhomie.com',  'Marco B.',  true,  true)
) as v(email, name, gold, sitter)
where p.id = (select id from auth.users u where u.email = v.email);

-- ---------- sitter profiles ----------
insert into sitter_profiles (profile_id, about, rate_per_night, reply_time, tags, lat, lng, verified, published)
select u.id, v.about, v.rate, v.reply, v.tags, v.lat, v.lng, true, true
from (values
  ('sara@demo.pawhomie.com',
   'Dog lover with 6 years of sitting experience. Lots of walks, cuddles, and daily photo updates so you can relax while you''re away.',
   42, 'Replies in 1 hr',    array['Fenced yard','Ok with other pets','Garden'], 43.6532, -79.3832),
  ('daniel@demo.pawhomie.com',
   'Calm, reliable carer who treats every pet like a guest of honour.',
   38, 'Replies in 2 hrs',   array['House with garden','Cats welcome'],          43.6620, -79.3960),
  ('priya@demo.pawhomie.com',
   'Former vet assistant — your pet is in expert, loving hands.',
   46, 'Replies in 30 min',  array['Fenced yard','Daily photos'],                43.6700, -79.4100),
  ('marco@demo.pawhomie.com',
   'Energetic and playful — perfect for pups who love their zoomies.',
   35, 'Replies in 1 hr',    array['Apartment','Small dogs'],                    43.6800, -79.4200)
) as v(email, about, rate, reply, tags, lat, lng)
join auth.users u on u.email = v.email
on conflict (profile_id) do update
  set about = excluded.about, rate_per_night = excluded.rate_per_night,
      reply_time = excluded.reply_time, tags = excluded.tags, published = true, verified = true;

-- ---------- a pet for the owner ----------
insert into pets (owner_id, name, species, breed, age_years)
select u.id, 'Milo', 'Dog', 'Beagle', 4
from auth.users u where u.email = 'aisha@demo.pawhomie.com'
and not exists (select 1 from pets pt where pt.owner_id = u.id and pt.name = 'Milo');

-- ---------- services ----------
insert into services (sitter_id, kind, price, enabled)
select sp.id, 'house_sitting', sp.rate_per_night, true from sitter_profiles sp
on conflict (sitter_id, kind) do nothing;

insert into services (sitter_id, kind, price, enabled)
select sp.id, 'drop_in', 20, true from sitter_profiles sp
on conflict (sitter_id, kind) do nothing;

-- ---------- availability: next 30 days open, weekends blocked ----------
insert into availability (sitter_id, day, status)
select sp.id,
       d::date,
       case when extract(dow from d) in (0,6) then 'blocked' else 'open' end
from sitter_profiles sp
cross join generate_series(current_date, current_date + interval '30 days', interval '1 day') d
on conflict (sitter_id, day) do nothing;

-- ---------- reviews (so ratings aren't empty) ----------
insert into reviews (author_id, sitter_id, rating, body)
select (select id from auth.users where email = 'aisha@demo.pawhomie.com'),
       sp.id, v.rating, v.body
from sitter_profiles sp
join profiles p on p.id = sp.profile_id
join (values
  ('Sara M.',   5, 'Sent photos every day and Milo came home happy. Booking again for sure.'),
  ('Daniel K.', 5, 'Super communicative and his garden was perfect for our energetic pup.'),
  ('Priya R.',  5, 'Absolute peace of mind — she knew exactly what to do.'),
  ('Marco B.',  4, 'Great with small dogs, lots of playtime.')
) as v(name, rating, body) on v.name = p.full_name
where not exists (
  select 1 from reviews r where r.sitter_id = sp.id and r.body = v.body
);

-- ---------- a conversation + messages ----------
insert into conversations (owner_id, sitter_id)
select o.id, s.id
from auth.users o, auth.users s
where o.email = 'aisha@demo.pawhomie.com' and s.email = 'sara@demo.pawhomie.com'
on conflict (owner_id, sitter_id) do nothing;

insert into messages (conversation_id, sender_id, body)
select c.id, (select id from auth.users where email = v.sender), v.body
from conversations c
join auth.users o on o.id = c.owner_id and o.email = 'aisha@demo.pawhomie.com'
join (values
  ('sara@demo.pawhomie.com',  'Hi! I''d love to look after Milo 🐾 Does he get along with other dogs?'),
  ('aisha@demo.pawhomie.com', 'Hi Sara! Yes, he''s super friendly.'),
  ('sara@demo.pawhomie.com',  'Perfect — my backyard''s fully fenced, lots of room to play.')
) as v(sender, body) on true
where not exists (select 1 from messages m where m.conversation_id = c.id and m.body = v.body);

-- ---------- a pending booking ----------
insert into bookings (owner_id, sitter_id, pet_id, start_date, end_date, subtotal, service_fee, total, status, note)
select o.id, sp.id, pt.id,
       current_date + 3, current_date + 6, 126, 12, 138, 'pending',
       'Milo loves morning walks and is a little shy at first.'
from auth.users o
join pets pt on pt.owner_id = o.id and pt.name = 'Milo'
join profiles pr on pr.full_name = 'Sara M.'
join sitter_profiles sp on sp.profile_id = pr.id
where o.email = 'aisha@demo.pawhomie.com'
and not exists (select 1 from bookings b where b.owner_id = o.id and b.sitter_id = sp.id and b.status = 'pending');

-- ---------- notifications ----------
insert into notifications (profile_id, title, body)
select u.id, 'Welcome to PawHomie 🐾', 'Your account is ready. Find a Paw Homie near you.'
from auth.users u where u.email = 'aisha@demo.pawhomie.com'
and not exists (select 1 from notifications n where n.profile_id = u.id);

-- ---------- check it worked ----------
select 'sitter_cards' as table, count(*) from sitter_cards
union all select 'profiles', count(*) from profiles
union all select 'availability', count(*) from availability
union all select 'reviews', count(*) from reviews;
