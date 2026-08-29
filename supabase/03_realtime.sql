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
