-- =====================================================================
-- PawHomie — add city/area to the search view
-- Run once in Supabase → SQL Editor.
-- Lets the search page filter Paw Homies by area.
--
-- We DROP then CREATE (not "create or replace") because Postgres won't
-- let you insert a new column into the middle of an existing view.
-- =====================================================================
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
  sp.lat,
  sp.lng
from sitter_profiles sp
join profiles p on p.id = sp.profile_id
left join reviews r on r.sitter_id = sp.id
where sp.published = true
group by sp.id, p.full_name, p.initial, p.avatar_gold, p.city;
