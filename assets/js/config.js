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

  // =====================================================================
  // FEES — the single source of truth for PawHomie's pricing model.
  // (Bilal's spec: sitters keep 85%, parents pay 7% capped, founding promo.)
  // Change these numbers to change fees everywhere in the app + payouts.
  // =====================================================================
  FEES: {
    SITTER_RATE:        0.15,   // platform takes 15% from the sitter (they keep 85%)
    SITTER_LOYAL_RATE:  0.12,   // 12% after the 4th completed booking with the same parent
    PARENT_RATE:        0.07,   // parent pays 7% on top of the sitter's price
    PARENT_MIN:         3.50,   // parent fee never less than $3.50
    PARENT_MAX:         25.00,  // parent fee never more than $25
    REVIEW_FEE:         29.00,  // one-time sitter application fee (refunded after 1st booking)

    // Founding promo (first 200 sitters per city). Flip FOUNDING_ACTIVE to false
    // when the promo ends; founding sitters stay locked by their profile flag.
    FOUNDING_ACTIVE:      true,
    FOUNDING_SITTER_RATE: 0.12, // founding sitters keep 88%
    FOUNDING_PARENT_RATE: 0.05, // founding-period parents pay 5%
    FOUNDING_REVIEW_FEE:  0     // review fee waived for founding sitters
  },

  // Back-compat: some older code still reads SERVICE_FEE_RATE. Keep it pointed
  // at the parent rate so nothing breaks; the real logic uses FEES above.
  SERVICE_FEE_RATE: 0.07,

  // Sales tax. Ontario HST is 13%. Applied to the PLATFORM FEES only
  // (Bilal's spec), not the sitter's base price.
  TAX_RATE: 0.13,
  TAX_LABEL: 'HST (13%)',

  // Stripe publishable key (safe to expose — it's the public half).
  // Test key starts with pk_test_, live key with pk_live_.
  STRIPE_PUBLISHABLE_KEY: 'pk_test_51U8uzoHaSru9fsWpgu5hUKfOwp8yG2fgdNLduLl38GidA5GjXCQXst2FMC39IVo7jDhqtnyZqUbAYffyF0of9rPC004MBgVm4u'
};

/* Until you paste real values above, the app runs on mock data so the
   front end keeps working. Once the keys are in, it switches to Supabase
   automatically — no other file needs to change. */
window.USE_SUPABASE =
  window.CONFIG.SUPABASE_URL.indexOf('http') === 0 &&
  window.CONFIG.SUPABASE_ANON_KEY.length > 20;
