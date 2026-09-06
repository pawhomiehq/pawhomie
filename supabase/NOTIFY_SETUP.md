# PawHomie — Booking Notification Emails Setup

Sends branded emails when booking things happen:
- Sitter gets an email on a NEW request
- Owner gets an email when accepted / declined / completed / cancelled

## 1. Add your Resend key as a secret (server-side only)
You already have your Resend API key (re_...). Add it as a secret so the
function can send email:
```
supabase secrets set RESEND_API_KEY=re_YOUR_KEY_HERE
```

## 2. Deploy the notify function
```
supabase functions deploy notify --no-verify-jwt
```

## 3. Push the app code
Copy the changed files into your project, then:
```
git add .
git commit -m "booking notification emails"
git push
```

## 4. Test
- Log in as an owner, book a sitter → the SITTER should get a "new request" email.
- Log in as that sitter, accept it → the OWNER gets an "accepted" email.
- Mark complete → owner gets a "leave a review" email.

All emails are brand-matched (teal header, white logo, your colors) and come
from noreply@pawhomie.com through Resend.

## Notes
- Emails are best-effort: if one fails to send, the booking action still works.
- When pawhomie.com goes live, update the logo URL + the "from" address in the
  notify function (supabase/functions/notify/index.ts) to the new domain.
