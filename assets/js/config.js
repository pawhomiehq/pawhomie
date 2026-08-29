/* =====================================================================
   PawHomie — configuration
   ---------------------------------------------------------------------
   1. In Supabase, open your project → Settings → API
   2. Copy "Project URL" and the "anon / public" key into the two lines below.

   The anon key is SAFE to put here — it's designed to be public, and Row
   Level Security (in 01_schema.sql) is what actually protects your data.
   NEVER paste the "service_role" key here. That one bypasses all security
   and must stay on a server, never in front-end code.
   ===================================================================== */

window.CONFIG = {
  SUPABASE_URL: 'https://sqpzvhybujbzutkcikkt.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcHp2aHlidWpienV0a2Npa2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMjk4MzQsImV4cCI6MjA5OTcwNTgzNH0.dUZ0IKynfEsG42dUuDgNpIr-ZXlZc3AgRW1DNlNzgcE',

  // Where distances are measured from until we ask for the user's location.
  DEFAULT_LOCATION: { lat: 43.6532, lng: -79.3832 }, // downtown Toronto

  // What PawHomie adds on top of the sitter's nightly rate (0.10 = 10%).
  // Change this one number to change the fee everywhere.
  SERVICE_FEE_RATE: 0.10,

  // Sales tax. Ontario HST is 13% (5% federal GST + 8% provincial) in 2026.
  // Applied to (subtotal + service fee). Change this one number to update everywhere.
  TAX_RATE: 0.13,
  TAX_LABEL: 'HST (13%)'
};

/* Until you paste real values above, the app runs on mock data so the
   front end keeps working. Once the keys are in, it switches to Supabase
   automatically — no other file needs to change. */
window.USE_SUPABASE =
  window.CONFIG.SUPABASE_URL.indexOf('http') === 0 &&
  window.CONFIG.SUPABASE_ANON_KEY.length > 20;
