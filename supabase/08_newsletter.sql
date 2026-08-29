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
