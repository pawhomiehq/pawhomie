-- =====================================================================
-- PawHomie — RUN EVERYTHING (in order). Paste into Supabase SQL Editor → Run.
-- Safe to run repeatedly.
-- =====================================================================

-- ==================== 01_schema.sql ====================
-- =====================================================================
-- PawHomie — database schema
-- Run this in Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- PROFILES (extends Supabase's auth.users) ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  initial     text generated always as (upper(left(coalesce(nullif(full_name,''),'?'),1))) stored,
  avatar_gold boolean not null default false,
  city        text default 'Toronto, ON',
  is_owner    boolean not null default true,
  is_sitter   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- PETS ----------
create table if not exists pets (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null references profiles(id) on delete cascade,
  name      text not null,
  species   text not null default 'Dog',
  breed     text,
  age_years int,
  notes     text,
  created_at timestamptz not null default now()
);
create index if not exists pets_owner_idx on pets(owner_id);

-- ---------- SITTER PROFILES ----------
create table if not exists sitter_profiles (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null unique references profiles(id) on delete cascade,
  about          text default '',
  rate_per_night numeric(10,2) not null default 40,
  reply_time     text default 'Replies in 1 hr',
  tags           text[] not null default '{}',
  lat            double precision,
  lng            double precision,
  verified       boolean not null default false,
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists sitter_published_idx on sitter_profiles(published);

-- ---------- SERVICES (what a sitter offers) ----------
create table if not exists services (
  id         uuid primary key default gen_random_uuid(),
  sitter_id  uuid not null references sitter_profiles(id) on delete cascade,
  kind       text not null check (kind in ('house_sitting','drop_in','walking','boarding','daycare')),
  price      numeric(10,2) not null,
  enabled    boolean not null default true,
  unique (sitter_id, kind)
);

-- ---------- AVAILABILITY ----------
create table if not exists availability (
  id        uuid primary key default gen_random_uuid(),
  sitter_id uuid not null references sitter_profiles(id) on delete cascade,
  day       date not null,
  status    text not null default 'open' check (status in ('open','blocked','booked')),
  unique (sitter_id, day)
);

-- ---------- BOOKINGS ----------
create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  sitter_id   uuid not null references sitter_profiles(id) on delete cascade,
  pet_id      uuid references pets(id) on delete set null,
  kind        text not null default 'house_sitting',
  start_date  date not null,
  end_date    date not null,
  nights      int  generated always as (greatest((end_date - start_date), 1)) stored,
  subtotal    numeric(10,2) not null default 0,
  service_fee numeric(10,2) not null default 0,
  total       numeric(10,2) not null default 0,
  note        text,
  status      text not null default 'pending'
              check (status in ('pending','accepted','declined','cancelled','completed')),
  created_at  timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists bookings_owner_idx  on bookings(owner_id);
create index if not exists bookings_sitter_idx on bookings(sitter_id);

-- ---------- CONVERSATIONS + MESSAGES ----------
create table if not exists conversations (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  sitter_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, sitter_id)
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists messages_convo_idx on messages(conversation_id, created_at);

-- ---------- REVIEWS ----------
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid unique references bookings(id) on delete set null,
  author_id  uuid not null references profiles(id) on delete cascade,
  sitter_id  uuid not null references sitter_profiles(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now()
);
create index if not exists reviews_sitter_idx on reviews(sitter_id);

-- ---------- NOTIFICATIONS ----------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- VIEW: sitter_cards  → matches exactly what the front end renders
-- =====================================================================
drop view if exists sitter_cards;
create view sitter_cards as
select
  sp.id,
  p.full_name                                as name,
  p.initial,
  p.avatar_gold                              as gold,
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
group by sp.id, p.full_name, p.initial, p.avatar_gold;

-- =====================================================================
-- AUTO-CREATE a profile row whenever someone signs up
-- =====================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- ROW LEVEL SECURITY
-- Without this, anyone with your public key could read/write everything.
-- =====================================================================
alter table profiles        enable row level security;
alter table pets            enable row level security;
alter table sitter_profiles enable row level security;
alter table services        enable row level security;
alter table availability    enable row level security;
alter table bookings        enable row level security;
alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table reviews         enable row level security;
alter table notifications   enable row level security;

-- profiles: anyone can read (needed to show sitter names); you edit only your own
drop policy if exists "profiles readable" on profiles;
create policy "profiles readable" on profiles for select using (true);
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update using (auth.uid() = id);

-- pets: only the owner
drop policy if exists "own pets" on pets;
create policy "own pets" on pets for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- sitter_profiles: published ones are public; sitters manage their own
drop policy if exists "published sitters readable" on sitter_profiles;
create policy "published sitters readable" on sitter_profiles for select using (published = true or auth.uid() = profile_id);
drop policy if exists "manage own sitter profile" on sitter_profiles;
create policy "manage own sitter profile" on sitter_profiles for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- services + availability: public read, sitter writes
drop policy if exists "services readable" on services;
create policy "services readable" on services for select using (true);
drop policy if exists "sitter manages services" on services;
create policy "sitter manages services" on services for all
  using (exists (select 1 from sitter_profiles sp where sp.id = services.sitter_id and sp.profile_id = auth.uid()))
  with check (exists (select 1 from sitter_profiles sp where sp.id = services.sitter_id and sp.profile_id = auth.uid()));

drop policy if exists "availability readable" on availability;
create policy "availability readable" on availability for select using (true);
drop policy if exists "sitter manages availability" on availability;
create policy "sitter manages availability" on availability for all
  using (exists (select 1 from sitter_profiles sp where sp.id = availability.sitter_id and sp.profile_id = auth.uid()))
  with check (exists (select 1 from sitter_profiles sp where sp.id = availability.sitter_id and sp.profile_id = auth.uid()));

-- bookings: only the owner or the sitter involved
drop policy if exists "see own bookings" on bookings;
create policy "see own bookings" on bookings for select using (
  auth.uid() = owner_id
  or exists (select 1 from sitter_profiles sp where sp.id = bookings.sitter_id and sp.profile_id = auth.uid())
);
drop policy if exists "owner creates booking" on bookings;
create policy "owner creates booking" on bookings for insert with check (auth.uid() = owner_id);
drop policy if exists "parties update booking" on bookings;
create policy "parties update booking" on bookings for update using (
  auth.uid() = owner_id
  or exists (select 1 from sitter_profiles sp where sp.id = bookings.sitter_id and sp.profile_id = auth.uid())
);

-- conversations + messages: participants only
drop policy if exists "own conversations" on conversations;
create policy "own conversations" on conversations for all
  using (auth.uid() = owner_id or auth.uid() = sitter_id)
  with check (auth.uid() = owner_id or auth.uid() = sitter_id);

drop policy if exists "read own messages" on messages;
create policy "read own messages" on messages for select using (
  exists (select 1 from conversations c where c.id = messages.conversation_id
          and (c.owner_id = auth.uid() or c.sitter_id = auth.uid()))
);
drop policy if exists "send messages" on messages;
create policy "send messages" on messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from conversations c where c.id = messages.conversation_id
    and (c.owner_id = auth.uid() or c.sitter_id = auth.uid()))
);

-- reviews: public read, author writes
drop policy if exists "reviews readable" on reviews;
create policy "reviews readable" on reviews for select using (true);
drop policy if exists "author writes review" on reviews;
create policy "author writes review" on reviews for insert with check (auth.uid() = author_id);

-- notifications: yours only
drop policy if exists "own notifications" on notifications;
create policy "own notifications" on notifications for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);


-- ==================== 03_realtime.sql ====================
-- =====================================================================
-- PawHomie — enable live chat
-- Run this once in Supabase → SQL Editor (after 01_schema.sql)
-- =====================================================================

-- Let Supabase broadcast new messages to connected clients.
-- Without this, chat still works but only refreshes when you reopen it.
-- (Wrapped so re-running never errors if it's already added.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

-- Realtime respects Row Level Security, so people only ever receive
-- messages from conversations they're actually part of. That policy is
-- already set in 01_schema.sql ("read own messages").

-- Check it worked — you should see "messages" listed:
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime';


-- ==================== 04_tax_column.sql ====================
-- Adds a tax column so the recorded total matches what the customer saw.
-- Run once in Supabase → SQL Editor.
alter table bookings add column if not exists tax numeric(10,2) not null default 0;


-- ==================== 05_favorites.sql ====================
-- =====================================================================
-- PawHomie — favorites
-- Run once in Supabase → SQL Editor.
-- =====================================================================
create table if not exists favorites (
  owner_id   uuid not null references profiles(id) on delete cascade,
  sitter_id  uuid not null references sitter_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, sitter_id)
);
create index if not exists favorites_owner_idx on favorites(owner_id);

alter table favorites enable row level security;

-- you can only see and change your own favorites
drop policy if exists "own favorites" on favorites;
create policy "own favorites" on favorites for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);


-- ==================== 06_pet_details.sql ====================
-- =====================================================================
-- PawHomie — extra pet details (care flags + notes already exist)
-- Run once in Supabase → SQL Editor.
-- =====================================================================
alter table pets add column if not exists friendly_with_pets boolean not null default true;
alter table pets add column if not exists needs_medication   boolean not null default false;
alter table pets add column if not exists microchipped       boolean not null default false;


-- ==================== 07_admin.sql ====================
-- =====================================================================
-- PawHomie — admin flag
-- Run once in Supabase → SQL Editor.
-- =====================================================================
alter table profiles add column if not exists is_admin boolean not null default false;

-- Make Bilal the admin. Change the email if his login is different.
update profiles set is_admin = true
where id = (select id from auth.users where email = 'bilal@pawhomie.com');

-- Check it worked (should list Bilal):
select p.id, p.full_name, p.is_admin, u.email
from profiles p join auth.users u on u.id = p.id
where p.is_admin = true;


-- ==================== 08_newsletter.sql ====================
-- =====================================================================
-- PawHomie — newsletter / waitlist signups (from the public footer)
-- Run once in Supabase → SQL Editor.
-- =====================================================================
create table if not exists newsletter (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table newsletter enable row level security;

-- Anyone (even logged-out visitors) may add their email, but nobody can
-- read the list from the browser — only you, in the Supabase dashboard.
drop policy if exists "anyone can subscribe" on newsletter;
create policy "anyone can subscribe" on newsletter
  for insert to anon, authenticated with check (true);


-- ==================== 09_sitter_city.sql ====================
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


-- ==================== 10_quiz_admin.sql ====================
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


-- ==================== 11_admin_oversight.sql ====================
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


-- ==================== 12_uploads.sql ====================
-- =====================================================================
-- PawHomie — sitter application documents & details
-- Run once in Supabase → SQL Editor.
-- =====================================================================

-- extra application details on the sitter profile
alter table sitter_profiles add column if not exists phone     text;
alter table sitter_profiles add column if not exists address   text;
alter table sitter_profiles add column if not exists home_type text;      -- House / Apartment / Condo / Townhouse
alter table sitter_profiles add column if not exists has_yard  boolean not null default false;
-- document storage paths, keyed by kind: { "id": "...", "selfie": "...", "home": "...", "yard": "..." }
alter table sitter_profiles add column if not exists documents jsonb not null default '{}'::jsonb;

-- =====================================================================
-- STORAGE bucket for the documents (private)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('sitter-docs', 'sitter-docs', false)
on conflict (id) do nothing;

-- Files live under a folder named after the uploader's auth id:
--   {auth.uid()}/self.jpg, {auth.uid()}/id.jpg, {auth.uid()}/home-1.jpg ...

-- sitter can upload into their own folder
drop policy if exists "upload own docs" on storage.objects;
create policy "upload own docs" on storage.objects for insert to authenticated
  with check ( bucket_id = 'sitter-docs' and (storage.foldername(name))[1] = auth.uid()::text );

-- sitter can replace their own files (upsert)
drop policy if exists "update own docs" on storage.objects;
create policy "update own docs" on storage.objects for update to authenticated
  using ( bucket_id = 'sitter-docs' and (storage.foldername(name))[1] = auth.uid()::text );

-- sitter reads their own; admin reads everyone's (for review)
drop policy if exists "read own or admin docs" on storage.objects;
create policy "read own or admin docs" on storage.objects for select to authenticated
  using (
    bucket_id = 'sitter-docs' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );


-- ==================== 13_owner_verification.sql ====================
-- =====================================================================
-- PawHomie — owner ID verification + pet vaccination records
-- Run once in Supabase → SQL Editor.
-- =====================================================================

-- owner identity verification (on the profile)
alter table profiles add column if not exists id_document     text;      -- storage path
alter table profiles add column if not exists id_status       text not null default 'unverified';
  -- unverified = never submitted
  -- pending    = uploaded, waiting for admin
  -- verified   = admin approved
  -- rejected   = admin rejected
alter table profiles add column if not exists id_submitted_at timestamptz;

-- pet vaccination records (on each pet)
alter table pets add column if not exists vaccination_doc    text;       -- storage path
alter table pets add column if not exists vaccination_status text not null default 'none';
  -- none = not uploaded, on_file = uploaded
alter table pets add column if not exists vaccination_note   text;       -- e.g. "Rabies exp. 2027"

-- =====================================================================
-- STORAGE bucket for owner documents (private)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('owner-docs', 'owner-docs', false)
on conflict (id) do nothing;

-- files live under {auth.uid()}/... e.g. {uid}/id.jpg, {uid}/pet-<petId>-vax.jpg
drop policy if exists "owner upload own docs" on storage.objects;
create policy "owner upload own docs" on storage.objects for insert to authenticated
  with check ( bucket_id = 'owner-docs' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "owner update own docs" on storage.objects;
create policy "owner update own docs" on storage.objects for update to authenticated
  using ( bucket_id = 'owner-docs' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "owner read own or admin docs" on storage.objects;
create policy "owner read own or admin docs" on storage.objects for select to authenticated
  using (
    bucket_id = 'owner-docs' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

-- admin can update any profile's id_status (approve/reject) — profiles already
-- has an admin update path from 10_quiz_admin? No: that was for sitter_profiles.
-- Add an admin update policy on profiles here.
drop policy if exists "admin updates profiles" on profiles;
create policy "admin updates profiles" on profiles for update
  using ( is_admin() );


-- ==================== 14_fix_login.sql ====================
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


-- ==================== 15_fix_rls_recursion.sql ====================
-- =====================================================================
-- PawHomie — FIX "infinite recursion detected in policy for profiles"
-- Run this in Supabase → SQL Editor.
--
-- Cause: admin policies checked is_admin by selecting FROM profiles,
-- which re-ran the profiles policy → infinite loop, so NO profile could
-- be read (login failed after auth).
--
-- Fix: a SECURITY DEFINER function that checks admin WITHOUT triggering
-- RLS, and rewrite every admin policy to call it.
-- =====================================================================

create or replace function is_admin()
returns boolean
language sql
security definer            -- runs as owner, bypasses RLS → no recursion
stable
set search_path = public
as $$
  select coalesce((select p.is_admin from profiles p where p.id = auth.uid()), false);
$$;

-- ---- profiles ----
drop policy if exists "admin reads all profiles" on profiles;
create policy "admin reads all profiles" on profiles for select using ( is_admin() );

drop policy if exists "admin updates profiles" on profiles;
create policy "admin updates profiles" on profiles for update using ( is_admin() );

-- ---- sitter_profiles ----
drop policy if exists "admin reads all sitters" on sitter_profiles;
create policy "admin reads all sitters" on sitter_profiles for select using ( is_admin() );

drop policy if exists "admin reviews sitters" on sitter_profiles;
create policy "admin reviews sitters" on sitter_profiles for update using ( is_admin() );

-- ---- bookings ----
drop policy if exists "admin reads all bookings" on bookings;
create policy "admin reads all bookings" on bookings for select using ( is_admin() );

-- ---- reviews ----
drop policy if exists "admin reads all reviews" on reviews;
create policy "admin reads all reviews" on reviews for select using ( is_admin() );

drop policy if exists "admin removes reviews" on reviews;
create policy "admin removes reviews" on reviews for delete using ( is_admin() );

-- ---- newsletter ----
drop policy if exists "admin reads newsletter" on newsletter;
create policy "admin reads newsletter" on newsletter for select using ( is_admin() );

-- ---- storage (sitter-docs / owner-docs admin read) ----
drop policy if exists "read own or admin docs" on storage.objects;
create policy "read own or admin docs" on storage.objects for select to authenticated
  using ( bucket_id = 'sitter-docs' and ( (storage.foldername(name))[1] = auth.uid()::text or is_admin() ) );

drop policy if exists "owner read own or admin docs" on storage.objects;
create policy "owner read own or admin docs" on storage.objects for select to authenticated
  using ( bucket_id = 'owner-docs' and ( (storage.foldername(name))[1] = auth.uid()::text or is_admin() ) );


-- ==================== 16_reports_replies.sql ====================
-- =====================================================================
-- PawHomie — reports (trust & safety) + provider review replies
-- Run in Supabase → SQL Editor.
-- =====================================================================

-- provider can reply to a review
alter table reviews add column if not exists reply text;

-- a simple reports table (works for reviews, conversations, messages)
create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  kind        text not null,                  -- 'review' | 'conversation' | 'message'
  target_id   uuid not null,                  -- id of the reported thing
  reason      text,
  status      text not null default 'open',   -- open | reviewed | dismissed
  created_at  timestamptz not null default now()
);
alter table reports enable row level security;

-- anyone signed in can file a report (about anything)
drop policy if exists "file a report" on reports;
create policy "file a report" on reports for insert to authenticated
  with check ( auth.uid() = reporter_id );

-- reporter can see their own; admin sees all
drop policy if exists "read own or admin reports" on reports;
create policy "read own or admin reports" on reports for select to authenticated
  using ( auth.uid() = reporter_id or is_admin() );

-- admin can update (resolve) reports
drop policy if exists "admin resolves reports" on reports;
create policy "admin resolves reports" on reports for update using ( is_admin() );

-- sitter can add a reply to a review about them
-- (the existing "own review" policies cover owners; add sitter update for reply)
drop policy if exists "sitter replies to review" on reviews;
create policy "sitter replies to review" on reviews for update
  using ( exists (
    select 1 from sitter_profiles sp
    where sp.id = reviews.sitter_id and sp.profile_id = auth.uid()
  ) );


-- ==================== 17_message_read.sql ====================
-- =====================================================================
-- PawHomie — message read tracking (for unread badges)
-- Run in Supabase → SQL Editor.
-- =====================================================================

alter table messages add column if not exists read_at timestamptz;

-- index to count unread quickly
create index if not exists messages_unread_idx on messages(conversation_id) where read_at is null;


-- MANUAL STEP if uploads say "Bucket not found":
--   Storage → New bucket → sitter-docs → Private
--   Storage → New bucket → owner-docs  → Private
