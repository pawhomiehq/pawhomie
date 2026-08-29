# PawHomie — Stripe Setup (test mode)

This turns on real card payments in TEST mode (fake money, real flow).
You'll do this once. ~15 minutes.

## What's already done (in the code)
- Publishable key is in `assets/js/config.js`
- Two secure server functions are written (in `supabase/functions/`)
- The checkout screen, payment hold, and capture-on-completion are wired

## What YOU need to do

### 1. Run the payments SQL
Supabase → SQL Editor → run **`19_payments.sql`** (adds payment columns to bookings).

### 2. Install the Supabase CLI (one time)
This lets you deploy the server functions. Easiest on Windows:
- Open PowerShell and run:  `npm install -g supabase`
  (If you don't have npm, install Node.js from nodejs.org first.)
- Check it worked:  `supabase --version`

### 3. Log in and link your project
In PowerShell, in your pawhomie folder:
```
supabase login
```
(opens browser, authorize)
```
supabase link --project-ref sqpzvhybujbzutkcikkt
```

### 4. Add the SECRET key (never goes in the app)
```
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```
Replace with Bilal's `sk_test_...` secret key.

### 5. Deploy the two functions
```
supabase functions deploy create-payment --no-verify-jwt
supabase functions deploy capture-payment --no-verify-jwt
```

### 6. Test it
- Open the live site, book a sitter, reach the payment screen.
- Use Stripe's test card:  **4242 4242 4242 4242**, any future expiry (e.g. 12/34), any CVC (e.g. 123), any postal code.
- Click "Hold & request." It should succeed and go to the confirmation screen.
- In Stripe dashboard (Test mode) → Payments, you'll see the payment as **"Uncaptured"** (held).
- When the booking is marked complete, it becomes **"Succeeded"** (captured).
- If declined/cancelled, the hold is released.

## Going live later
When ready for real money: in Stripe switch to Live mode, get the `pk_live_`
and `sk_live_` keys, put `pk_live_` in config.js, and re-run step 4 with the
live secret. That's it.
