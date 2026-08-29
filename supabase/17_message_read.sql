-- =====================================================================
-- PawHomie — message read tracking (for unread badges)
-- Run in Supabase → SQL Editor.
-- =====================================================================

alter table messages add column if not exists read_at timestamptz;

-- index to count unread quickly
create index if not exists messages_unread_idx on messages(conversation_id) where read_at is null;
