# PawHomie — Backend Setup (Supabase)

About 15 minutes. Do the steps in order.

---

## 1. Create the project

1. Go to **supabase.com** → sign in with GitHub → **New project**
2. Name: `pawhomie` · Region: **East US (N. Virginia)** — closest to Toronto
3. Set a database password and **save it somewhere safe** (you won't need it for the app, but you'll want it later)
4. Wait ~2 minutes for it to finish provisioning

## 2. Create the tables

1. Left sidebar → **SQL Editor** → **New query**
2. Open `01_schema.sql`, copy **everything**, paste it in, hit **Run**
3. You should see *"Success. No rows returned"*
4. Check the **Table Editor** — you should now see: `profiles`, `pets`, `sitter_profiles`, `services`, `availability`, `bookings`, `conversations`, `messages`, `reviews`, `notifications`

## 3. Create the demo users

**Authentication → Users → Add user** (repeat 5×, tick **Auto Confirm User** each time):

| Email | Password |
|---|---|
| `aisha@demo.pawhomie.com` | `demo123456` |
| `sara@demo.pawhomie.com` | `demo123456` |
| `daniel@demo.pawhomie.com` | `demo123456` |
| `priya@demo.pawhomie.com` | `demo123456` |
| `marco@demo.pawhomie.com` | `demo123456` |

> These are throwaway demo logins. Aisha is the pet owner (your test account); the other four are the Paw Homies.

## 4. Add the demo data

**SQL Editor → New query** → paste all of `02_seed.sql` → **Run**.

The last query prints a count. You should see roughly:

```
sitter_cards   4
profiles       5
availability   124
reviews        4
```

If `sitter_cards` is 0, the emails in step 3 don't match — check for typos.

## 5. Connect the front end

**Settings → API**, copy two values into `assets/js/config.js`:

```js
window.CONFIG = {
  SUPABASE_URL: 'https://YOURPROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGci...'
};
```

- **Project URL** → `SUPABASE_URL`
- **anon / public** key → `SUPABASE_ANON_KEY`

⚠️ **Only ever use the `anon` key here.** Never the `service_role` key — that one bypasses all security and must never appear in front-end code or GitHub.

## 6. Test it

Reload the app and open the browser console (F12):

- `PawHomie: connected to Supabase` → you're live
- `PawHomie: running on mock data` → keys aren't right yet

Go to **Search**. If you see Sara, Daniel, Priya and Marco with real distances (~1–3 km), the database is talking to the front end. 🎉

---

## How it's wired

Every page calls `window.db.*` — nothing else. `data.js` decides where that goes:

- **No keys in config.js** → mock data (front end still fully works)
- **Keys present** → live Supabase

So you can always fall back to mock by blanking the keys.

## Security (important)

Row Level Security is **on for every table**, with policies in `01_schema.sql`:

- Anyone can browse **published** sitter profiles and reviews
- You can only see **your own** pets, bookings and notifications
- Only the **owner or sitter** on a booking can see it
- Only **conversation participants** can read/send messages
- Sitters can only edit **their own** rates and availability

This is what makes it safe to ship the anon key in the browser. Don't disable RLS.

## Table map

| Table | What it holds |
|---|---|
| `profiles` | one row per user (auto-created on signup) |
| `pets` | an owner's pets |
| `sitter_profiles` | rate, about, tags, location, verified |
| `services` | which services a sitter offers + price |
| `availability` | open / blocked / booked, per day |
| `bookings` | the booking + status + totals |
| `conversations` / `messages` | chat |
| `reviews` | ratings (feed the star average) |
| `notifications` | in-app alerts |
| `sitter_cards` *(view)* | joins the above into the exact shape the search page renders |

## Not done yet (deliberately)

- **Stripe payments** — needs Stripe Connect + a server-side piece; the payment page is UI-only for now
- **Live video calls** — Phase 2 (needs Daily/Twilio/Agora + per-minute costs)
- **Photo uploads** — next step is a Supabase Storage bucket for sitter/pet photos

---

## 7. Turn on real accounts (signup / login)

The signup page is now wired to real Supabase auth.

**Do this first, or signups will look broken:**

**Authentication → Sign In / Providers → Email** → turn **"Confirm email" OFF** while you're testing.

By default Supabase emails a confirmation link before the account can log in. With it on, you'll sign up and get *"check your inbox"* instead of being logged in — with a demo domain that email never arrives. Turn it back **ON before launch**, once real email delivery is set up.

### Test it end-to-end
1. Open the app → **Create an account**
2. Enter a name, a real-looking email, a 6+ char password, pick **owner** or **Paw Homie**
3. You should land on Search (owner) or the Sitter dashboard (Paw Homie)
4. Check **Authentication → Users** — your new user is there
5. Check **Table Editor → profiles** — a row was auto-created with the name and role
6. Go to **Dashboard** — it greets you by your real name
7. **Settings → Log out**, then log back in

### What's wired
- **Sign up** — creates the auth user, auto-creates the profile (via trigger), sets owner/sitter role, and creates an empty `sitter_profiles` row for sitters
- **Log in** — real session; routes sitters to the sitter dashboard
- **Log out** — ends the session properly
- **Dashboard** — shows the real name and initial
- **Errors are human** — "That email already has an account", "Wrong email or password", etc.

---

## 8. Turn on live chat

**SQL Editor → New query** → paste `03_realtime.sql` → **Run**.

That's one line: it lets Supabase push new messages to open browsers. Without it chat still works, but messages only appear when you reopen the thread.

Realtime respects Row Level Security, so people only ever receive messages from conversations they're actually in.

### Test it
1. Search → open a sitter → **Message Sara** → a real thread opens
2. Send a message → check **Table Editor → messages**, your row is there
3. **The real test:** open the app in a normal window *and* an incognito window, log in as the owner in one and the sitter in the other (`sara@demo.pawhomie.com`), open the same thread in both, and send. It should appear on the other side **instantly, with no refresh**.

### What's wired
- **Message** on a sitter profile starts (or reopens) a real thread — never duplicates
- Messages load from the DB; **yours are teal on the right, theirs white on the left**
- New messages arrive **live** via Realtime
- Sending shows the bubble instantly; if it fails it turns red — **tap to retry**
- Channels are cleaned up on navigation (no memory leaks)

---

## 9. Favorites

**SQL Editor → New query** → paste `05_favorites.sql` → **Run**. Creates the `favorites` table (with security so people only see their own).

### What's wired
- The **heart** on any Paw Homie card now saves to the database and stays saved after refresh
- A **Favorites page** (heart on the desktop top nav, and a quick-action on the dashboard) lists everyone you've saved
- Un-hearting on the Favorites page removes them with a little animation
- Empty state prompts you to go find Paw Homies

---

## 10. Pet details

**SQL Editor → New query** → paste `06_pet_details.sql` → **Run**. Adds three care flags to the `pets` table (friendly with other pets / needs medication / microchipped).

### What's wired
- **My pets** is now real: add, edit and remove pets, all saved to the database
- Notes and care flags show on the pet card
- This also fixes a dead end: a brand-new user with no pets was sent from the booking page to add one, but the old page saved nothing — so booking was impossible

---

## 11. The four sides (access control)

**SQL Editor → New query** → paste `07_admin.sql` → **Run**. Adds the `is_admin` flag and makes Bilal the admin.

⚠️ **Edit the email first.** The file sets `bilal@pawhomie.com` — change it to whatever address Bilal actually signs up with, or the update matches nobody.

### What's wired
- Every page has an access level (`public` / `user` / `owner` / `sitter` / `admin`) in `assets/js/roles.js`
- The router checks it before rendering, so typing a URL can't get you into another side
- The navigation changes per side — people only see links they can actually use
- Visitors can browse Paw Homies and read profiles, but booking or messaging prompts them to sign up

---

## 12. Newsletter (visitor side)

**SQL Editor → New query** → paste `08_newsletter.sql` → **Run**. Creates the `newsletter` table.

Visitors can drop their email in the landing-page footer. Anyone can *add* an email (even logged out), but **nobody can read the list from the browser** — you view subscribers in the Supabase dashboard (Table Editor → newsletter). That keeps the list private without needing a login.

This completes the visitor side: browse sitters (works logged-out via RLS), read profiles, subscribe, and sign up. Everything a non-user can do now has a real backend.

---

## 13. Owner side complete (booking detail, reviews, notifications)

No new tables — these use `bookings`, `reviews` and `notifications`, which already exist.

### What's now real
- **Booking detail** — tap a booking on the dashboard to see it: a status timeline (request → accepted → complete), the real payment breakdown, and your note
- **Cancel** — cancel a pending or confirmed booking
- **Leave a review** — after a completed stay; saves to `reviews` and feeds the sitter's star rating. A booking that's already reviewed shows the rating instead of the button
- **Notifications** — loaded from the `notifications` table, newest first, unread highlighted, marked read when you open the page

That completes the pet owner side: every owner page now runs on real data.

---

## 14. Location + real-profile fixes

Run **`09_sitter_city.sql`** (adds the area to the search view so location filtering works).

Then, because your database still has the old seeded "Aisha" rows, run **`99_wipe_demo.sql`** once and **`02b_seed_sitters_only.sql`** to reseed clean sitters. After that, sign up fresh and you'll see YOUR name everywhere.

### What changed
- **Signup now asks for your area** and writes your name + city straight to your profile (no more blank/stale names).
- **Account page reads your real profile** — it was previously showing a hardcoded "Aisha Khan / aisha@email.com". That's gone.
- **Search has an area picker** — defaults to your city, filter Paw Homies by any GTA area.
- **Your Supabase keys are baked into config.js** — no more pasting each download.

---

## 15. Sitter side (the Paw Homie app)

No new tables — uses `bookings`, `services`, `availability`, `sitter_profiles`, all already created.

### What's now real
- **Sitter dashboard** — real earnings, upcoming count, rating, and a live "Not published/Live" badge
- **Booking requests** — a sitter sees only *their own* pending requests, and **Accept / Decline** actually updates the booking. This is the piece that was missing: an owner's booking now moves pending → **confirmed** (or declined) for real
- **Services & rates** — turn each service on/off, set its price, set your nightly rate and about text, and **publish** your profile (unpublished sitters don't appear in search)
- **Availability** — a real calendar; tap days to open or block them, saved live. Booked days are locked

### Still to build (separate pieces)
- **Verification** — the 10-question quiz + admin approval (the gate before a sitter goes live)
- **Payouts** — real money (Stripe, Phase 2)

---

## 16. IMPORTANT — re-run the sitter seed (fixes "sitter looks like owner")

The old seed left demo sitters flagged as BOTH owner and sitter, so logging in as a
Paw Homie landed you on the owner dashboard. The seed now sets `is_owner = false`.

**Re-run `02b_seed_sitters_only.sql`** to fix your existing sitters. If you recreated
any accounts (e.g. Priya), this is required — otherwise they're treated as owners.

You can also fix them by hand in SQL Editor:
```sql
update profiles set is_owner = false, is_sitter = true
where id in (select id from auth.users where email like '%@demo.pawhomie.com');
```

---

## 17. Care quiz + admin approval

Run **`10_quiz_admin.sql`**. It adds the quiz score + application status to sitters,
gates search so only **approved** sitters appear, and gives the admin read/update access.
(It also auto-approves any demo sitters you already seeded, so they keep showing.)

### The gate (how a sitter goes live)
1. A new Paw Homie signs up → status `draft`, not in search
2. **Verification page** → takes the 10-question care quiz (80% to pass)
3. Pass → application becomes `pending`; their score is saved
4. **Admin (Bilal)** opens the Admin page → sees pending applicants with their scores → **Approve** or **Reject**
5. Approved + published → the Paw Homie now appears in search

Passing the quiz is required but NOT automatic approval — the final call is the admin's,
and they can see each applicant's score. Fail the quiz and you can retake it.

### Admin access
Make sure `07_admin.sql` has run with Bilal's real email so his account is flagged
`is_admin`. He then sees an **Admin** link in the nav.

---

## 18. Admin panel (oversight) + admin-only nav

Run **`11_admin_oversight.sql`** (lets the admin read all bookings, reviews and the
newsletter list, and remove abusive reviews).

### The admin now sees an admin-only app
Bilal's nav no longer shows Home/Search/My bookings/Favorites — just the **Admin panel**,
Messages and Account. The panel has five sections:

- **Overview** — commission earned, active bookings, owners, Paw Homies, completed stays, waitlist size, and a shortcut to pending applications
- **Applications** — the quiz review queue (pending / approved / rejected) with scores
- **Paw Homies** — every sitter, with Suspend / Approve to control who's live
- **Bookings** — all bookings across the platform for oversight
- **Reviews** — remove abusive or fake reviews

---

## 19. Sitter application: documents & photos

Run **`12_uploads.sql`**. It adds the application detail columns + a private
`sitter-docs` storage bucket with the right access rules (a sitter can upload
to their own folder; only they and the admin can read the files).

### The application is now a real two-step flow
1. **Details & documents** — phone, address, home type, backyard, and photo uploads:
   government ID, a selfie, a photo of the home (walk-area optional). Files go to
   Supabase Storage, privately.
2. **Care quiz** — the 10-question quiz (80% to pass).

Only when **both** are done can the sitter submit. Then it goes to the admin as
`pending`.

### Admin sees the documents
On the Applications tab, each applicant now shows their details and **document
thumbnails** (ID, selfie, home). Tapping one opens the full image via a
time-limited signed URL. Bilal reviews the real evidence, not just a quiz score,
then approves or rejects.

---

## 20. Sitter onboarding clarity + photo guidance

No SQL. UX fixes:
- **The Paw Homie dashboard now tells a new sitter what to do.** A prominent banner
  appears based on their status: "Get verified before you can be booked" (draft, red)
  → "Application under review" (pending) → "Publish to go live" (approved) →
  "needs another look" (rejected). The Verification tile also gets an attention dot.
- **A photo-guidance popup** appears before uploading a Government ID or selfie,
  with clear Do / Avoid lists (lighting, glare, blur, corners) and a warning that
  unclear photos are likely to be rejected.
- **Account label fixed** — a pure Paw Homie no longer sees the confusing
  "Switch to Paw Homie"; they see "My Paw Homie dashboard". "Switch" only shows
  for accounts that are both owner and sitter.

---

## 21. Owner ID verification + pet vaccination

Run **`13_owner_verification.sql`** (adds owner ID fields to profiles, vaccination
fields to pets, an `owner-docs` private storage bucket, and admin review access).

### What owners now do
- **Verify their ID** — a "Verify your ID" banner on their home + an Account link.
  They upload a government ID (with the same photo-guidance popup), which goes to a
  private bucket. Status: unverified → pending → verified/rejected.
- **Pet vaccination** — each pet (in My Pets → edit) gets a vaccination-proof upload.
  Sitters see "vaccination on file" — not the document itself (privacy).
- **At booking time** — a soft notice asks them to verify within 48 hours. They can
  still book right away (we don't block the conversion).

### Admin
The admin panel has a new **Owners** tab: review owner ID submissions with the
document thumbnail, then Verify or Reject.

> Note: the "48-hour" auto-cancel would need a scheduled job (Phase 2). For now it's
> shown as guidance and the owner's status is visible everywhere.
