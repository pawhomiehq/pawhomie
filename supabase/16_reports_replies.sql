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
