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
