# PawHomie — Backend Setup (do this once)

Everything the app needs, in the right order. ~5 minutes.

## Step 1 — Run the database migrations
1. Open your Supabase project → **SQL Editor** → **New query**
2. Open **`RUN_ALL.sql`** from this folder, copy the whole thing, paste, **Run**.
   - This creates all 10 tables, the views, every security policy, the quiz/admin/
     verification columns, and tries to create the two storage buckets.
   - It's safe to run more than once.

## Step 2 — Create the storage buckets (if needed)
If uploading a document ever says **"Bucket not found"**, the SQL couldn't create
buckets in your project (some can't). Create them by hand — 20 seconds each:
1. **Storage** → **New bucket** → name exactly `sitter-docs` → **Private** → Create
2. **Storage** → **New bucket** → name exactly `owner-docs` → **Private** → Create

The access policies from Step 1 already cover both buckets.

## Step 3 — Make yourself the admin
In **SQL Editor**, run (with the email you'll log in as):
```sql
update profiles set is_admin = true where id =
  (select id from auth.users where email = 'bilal@pawhomie.com');
```

## Step 4 — (Optional) demo sitters for browsing
1. **Authentication → Users → Add user** (tick *Auto Confirm*) for
   sara@ / daniel@ / priya@ / marco@ **@demo.pawhomie.com**
2. Run **`02b_seed_sitters_only.sql`**

## That's it
The three sides are now fully wired:
- **Owners** — sign up, book, verify ID, add pet vaccination
- **Paw Homies** — quiz + documents, services, availability, accept/decline
- **Admin** — review applications & owner IDs, manage sitters, bookings, reviews

Your Supabase keys are already baked into `assets/js/config.js`, so the app is
connected the moment you open it.
