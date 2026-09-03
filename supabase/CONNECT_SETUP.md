# PawHomie — Sitter Payouts (Stripe Connect) Setup

This lets sitters connect their bank and get paid automatically, with
PawHomie keeping its 10% commission on each booking. ~10 minutes.

## 1. Run the SQL
Supabase → SQL Editor → run **`20_connect.sql`**
(adds stripe_account_id + payouts_enabled to sitter_profiles).

## 2. Turn ON Stripe Connect in the Stripe dashboard
The Connect functions need Connect enabled on Bilal's account:
- Stripe dashboard (Test mode) → search "Connect" → **Get started / Enable Connect**.
- If it asks for a platform name, use "PawHomie".
- You don't need to fill out everything — just enabling it is enough for test mode.

## 3. Add the service-role key as a secret
The Connect functions read/write sitter records, so they need Supabase's
service-role key (a powerful key — it stays server-side only, never in the app).

- Supabase → Project Settings → API → copy the **service_role** key (starts with eyJ...).
- In your VS Code terminal (in the pawhomie folder):
```
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=PASTE_SERVICE_ROLE_KEY_HERE
```
(SUPABASE_URL is provided automatically — you don't need to set it.)

## 4. Deploy the three functions
```
supabase functions deploy connect-onboarding --no-verify-jwt
supabase functions deploy connect-status --no-verify-jwt
supabase functions deploy create-payment --no-verify-jwt
```
(create-payment is re-deployed because it now does the auto-split.)

## 5. Push the app code
Copy the changed files into your project, then:
```
git add .
git commit -m "add sitter payouts (stripe connect)"
git push
```

## 6. Test it
- Log in as a sitter → dashboard → **Payouts** → **Set up payouts**.
- It opens Stripe's hosted onboarding. In TEST mode you can use Stripe's test
  values (Stripe shows a "skip"/"use test data" helper). Finish it.
- Back on the Payouts page it should say **"Payouts active"**.
- Now when an owner books that sitter and pays, Stripe auto-splits:
  sitter gets 90%, PawHomie keeps 10%. You'll see it in Stripe → Connect → Payments.

## Going live later
Same as the main Stripe steps — switch to live keys, and each real sitter
completes onboarding once with their real bank + ID.
