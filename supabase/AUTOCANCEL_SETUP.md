# PawHomie — 48-Hour Auto-Cancel Setup

Cancels bookings that are still unpaid after 48 hours, automatically,
every hour. No app code changes — this is all in the database.

## Steps

### 1. Run the SQL
Supabase → SQL Editor → New query → paste **`21_auto_cancel.sql`** → Run.

That's it. It:
- enables the scheduler (pg_cron),
- creates the cancel function,
- schedules it to run every hour.

### 2. (Optional) confirm it's scheduled
Run this in SQL Editor — you should see a row named `pawhomie_auto_cancel`:
```
select jobname, schedule from cron.job;
```

### 3. (Optional) test it right now
To run the cleanup immediately instead of waiting for the hour:
```
select auto_cancel_stale_bookings();
```
Any booking that's been 'pending' + unpaid for over 48h becomes 'cancelled'.

## What gets cancelled
Only bookings that are ALL of:
- status = 'pending' (never accepted)
- no payment held (payment_status = 'none')
- created more than 48 hours ago

Paid/held bookings and accepted bookings are never touched.

## Note
If `create extension pg_cron` errors, enable it via the dashboard first:
Database → Extensions → search "pg_cron" → enable, then re-run the file.
