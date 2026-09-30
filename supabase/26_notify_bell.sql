-- =====================================================================
-- PawHomie — in-app notification bell
-- ---------------------------------------------------------------------
-- Emails for booking events were already sent by the `notify` function.
-- This adds the matching IN-APP alerts (the bell), created server-side so
-- Row Level Security is never in the way and it fires no matter who made
-- the change (owner, sitter, admin, or the hourly auto-cancel job).
--
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- =====================================================================

create or replace function notify_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sitter_pid uuid;
  dates text;
begin
  -- "Aug 3 – Aug 6"
  dates := to_char(NEW.start_date, 'Mon FMDD') || ' – ' || to_char(NEW.end_date, 'Mon FMDD');
  select profile_id into sitter_pid from sitter_profiles where id = NEW.sitter_id;

  -- New request -> tell the sitter
  if TG_OP = 'INSERT' then
    if sitter_pid is not null then
      insert into notifications (profile_id, title, body)
      values (sitter_pid, 'New booking request',
              'You have a new booking request for ' || dates || '. Open Requests to accept or decline.');
    end if;
    return NEW;
  end if;

  -- Status changed -> tell the owner (and the sitter on a cancel)
  if TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    if NEW.status = 'accepted' then
      insert into notifications (profile_id, title, body)
      values (NEW.owner_id, 'Booking accepted',
              'Your booking for ' || dates || ' was accepted. Open it to see the details.');
    elsif NEW.status = 'declined' then
      insert into notifications (profile_id, title, body)
      values (NEW.owner_id, 'Booking update',
              'Your request for ' || dates || ' was not accepted this time. No charge was made — you can find another Paw Homie.');
    elsif NEW.status = 'completed' then
      insert into notifications (profile_id, title, body)
      values (NEW.owner_id, 'Stay complete',
              'Your stay for ' || dates || ' is complete. Leave a review to help other pet parents.');
    elsif NEW.status = 'cancelled' then
      insert into notifications (profile_id, title, body)
      values (NEW.owner_id, 'Booking cancelled',
              'Your booking for ' || dates || ' was cancelled and any hold on your card was released.');
      if sitter_pid is not null then
        insert into notifications (profile_id, title, body)
        values (sitter_pid, 'Booking cancelled',
                'A booking for ' || dates || ' was cancelled.');
      end if;
    end if;
  end if;

  return NEW;
end
$$;

drop trigger if exists trg_notify_booking_ins on bookings;
create trigger trg_notify_booking_ins
  after insert on bookings
  for each row execute function notify_on_booking();

drop trigger if exists trg_notify_booking_upd on bookings;
create trigger trg_notify_booking_upd
  after update on bookings
  for each row execute function notify_on_booking();
