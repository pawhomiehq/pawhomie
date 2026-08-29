# PawHomie — Front-end

A mobile-responsive front-end for the PawHomie pet-sitting marketplace.
No build step — plain HTML/CSS/JS. Runs from a file or any static host.

## Run locally
Just open `index.html` in a browser. (For clean routing, you can also serve it:
`npx serve` or `python3 -m http.server`.)

## Deploy
Push to GitHub and import into **Vercel** — it's static, so no config is needed
(`vercel.json` adds SPA-style routing). Works on Netlify / any static host too.

## Structure
```
pawhomie/
  index.html               app shell (nav, overlays, script includes)
  vercel.json              static hosting config
  assets/
    css/styles.css         design system + all page/component styles (responsive)
    js/
      data.js              MOCK data + the `db` layer  <-- swap to Supabase here
      ui.js                shared UI helpers (icons, avatar, tag, nav, etc.)
      router.js            hash router
      app.js               init, global click routing, mascot, toast
      video.js             video-call sheet + live-call overlay
      pages/               one file per page (owner + sitter + shared)
```

## Connecting the backend (Supabase) — the seam
Everything reads data through `db` in `assets/js/data.js`. Today it returns mock
data; tomorrow, replace the insides with Supabase calls, e.g.

```js
const { data } = await supabase.from('sitters').select('*');
return data;
```

Add the client in `index.html` before `data.js`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```
The UI never changes — only `db`'s internals.

## Routes (hash-based)
#/welcome  #/signup  #/search  #/profile  #/booking  #/payment  #/confirmation
#/dashboard  #/messages  #/chat  #/petProfile  #/bookingDetail  #/review
#/sitterDashboard  #/services  #/availability  #/requests  #/verification
#/payouts  #/notifications  #/settings
