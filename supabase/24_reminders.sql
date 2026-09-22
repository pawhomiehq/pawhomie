-- =====================================================================
-- PawHomie — day-before booking reminder (Tier 5)
-- Run in Supabase → SQL Editor.
--
-- Every day, for accepted bookings that start TOMORROW, drop a reminder
-- message into the conversation asking the owner to confirm the stay is
-- still on. Runs via pg_cron. (Email reminders are sent by the app/notify
-- function; this guarantees an in-app nudge even if nobody opens the app.)
-- =====================================================================

create extension if not exists pg_cron;

-- avoid duplicate reminders: track which bookings we've reminded
alter table bookings add column if not exists reminder_sent boolean not null default false;

create or replace function send_booking_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b record;
  conv_id uuid;
  owner_uid uuid;
  sitter_uid uuid;
begin
  for b in
    select bk.id, bk.owner_id, bk.sitter_id, bk.start_date, bk.end_date
    from bookings bk
    where bk.status = 'accepted'
      and bk.reminder_sent = false
      and bk.start_date = (current_date + 1)
  loop
    owner_uid := b.owner_id;
    -- sitter_id on bookings references sitter_profiles; get that sitter's user id
    select sp.profile_id into sitter_uid from sitter_profiles sp where sp.id = b.sitter_id;

    if sitter_uid is not null then
      -- find or create the conversation between this owner and sitter
      select c.id into conv_id from conversations c
        where c.owner_id = owner_uid and c.sitter_id = sitter_uid limit 1;
      if conv_id is null then
        insert into conversations (owner_id, sitter_id) values (owner_uid, sitter_uid)
          returning id into conv_id;
      end if;

      -- message appears to come FROM the sitter, asking the owner to confirm
      insert into messages (conversation_id, sender_id, body)
      values (conv_id, sitter_uid,
        'Hi! Just a friendly reminder that our booking starts tomorrow ('
        || to_char(b.start_date, 'Mon DD') || '). Are we still all set? Please confirm here or let me know if anything changed. 🐾');
    end if;

    update bookings set reminder_sent = true where id = b.id;
  end loop;
end $$;

-- run every day at 15:00 UTC (~10-11am Eastern)
do $$
declare jid int;
begin
  for jid in select jobid from cron.job where jobname = 'pawhomie_booking_reminders' loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule('pawhomie_booking_reminders', '0 15 * * *',
  $$ select send_booking_reminders(); $$);

-- test now:  select send_booking_reminders();
