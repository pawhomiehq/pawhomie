# PawHomie — Real Video Calling (Daily.co) Setup

Real 1:1 video calls between owners and Paw Homies. Free tier is plenty for
launch. No calls are recorded.

## 1. Make a free Daily.co account
- Go to daily.co → Sign up (free).
- Dashboard → Developers → copy your **API key**.
- Note your Daily **domain** (like yourname.daily.co) — you already gave this to
  Claude for the code.

## 2. Add the Daily API key as a secret (server-side only)
```
supabase secrets set DAILY_API_KEY=paste_your_daily_api_key_here
```
(Don't put this key in the app code — it stays a Supabase secret.)

## 3. Deploy the video-room function
```
supabase functions deploy video-room --no-verify-jwt
```

## 4. Push the app code
Copy the changed files into your project, then:
```
git add .
git commit -m "real video calling"
git push
```

## 5. Test it
- Open a conversation (as owner OR sitter) → tap **"Video call"** at the top.
- Allow camera + microphone when the browser asks.
- On another device/browser, log in as the OTHER person, open the same
  conversation, tap "Video call" — you'll both be in the SAME room.
- You get a real call: camera, mic, mute, camera on/off, and a Leave button.
- Tapping Leave ends the call cleanly and returns to chat.

## Good to know
- Needs HTTPS for the camera — your Vercel site is HTTPS, so it works there.
- Rooms are private (only these two people), limited to 2 participants, and
  auto-expire after 2 hours.
- Nothing is recorded or saved — calls are live-only (privacy-safe).
- Free tier: 10,000 participant-minutes/month. Plenty for intro calls.
