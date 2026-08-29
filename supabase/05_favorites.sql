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
