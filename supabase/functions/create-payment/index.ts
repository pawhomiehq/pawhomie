// =====================================================================
// PawHomie — create-payment Edge Function (with auto-split)
// Authorizes (holds) the owner's payment. The amount and the sitter split
// are recomputed here from the BOOKING in the database — never trusted from
// the browser — and the caller must be the booking's owner.
//
// Deploy: supabase functions deploy create-payment --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, SERVICE_ROLE_KEY (SUPABASE_URL/ANON auto-injected)
// =====================================================================

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function fail(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Fee rates — mirror assets/js/config.js FEES. The server is the source of truth.
const SITTER_RATE = 0.15;
const SITTER_LOYAL_RATE = 0.12;
const FOUNDING_SITTER_RATE = 0.10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { bookingId, currency, description } = await req.json();
    if (!bookingId) return fail("Missing booking.");

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) return fail("Server not configured.", 500);

    // Who is calling?
    const asUser = createClient(url, anonKey, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: ures } = await asUser.auth.getUser();
    const user = ures?.user;
    if (!user) return fail("Please sign in.", 401);

    // Load the booking with the service role and verify the caller owns it.
    const admin = createClient(url, serviceKey);
    const { data: bk, error: bkErr } = await admin
      .from("bookings")
      .select("id, owner_id, sitter_id, subtotal, total, status")
      .eq("id", bookingId)
      .maybeSingle();
    if (bkErr || !bk) return fail("Booking not found.");
    if (bk.owner_id !== user.id) return fail("You can't pay for this booking.", 403);
    if (bk.status !== "pending" && bk.status !== "accepted") return fail("This booking can't be paid for.");

    // Amount is the booking total from the DB, in cents. Never from the client.
    const cents = Math.round(Number(bk.total) * 100);
    if (!cents || cents < 50) return fail("Invalid booking amount.");

    // Sitter split, computed server-side.
    const { data: sp } = await admin
      .from("sitter_profiles")
      .select("id, profile_id, stripe_account_id, payouts_enabled, is_founding")
      .eq("id", bk.sitter_id)
      .maybeSingle();

    let sRate = SITTER_RATE;
    if (sp?.is_founding) {
      sRate = FOUNDING_SITTER_RATE;
    } else {
      // loyalty: 4+ completed bookings between this owner and sitter
      const { count } = await admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", bk.owner_id).eq("sitter_id", bk.sitter_id).eq("status", "completed");
      if ((count || 0) >= 4) sRate = SITTER_LOYAL_RATE;
    }

    const sitterEarnsCents = Math.round(Number(bk.subtotal) * (1 - sRate) * 100);
    const platformFeeCents = Math.max(0, cents - sitterEarnsCents);

    const params: any = {
      amount: cents,
      currency: currency || "cad",
      capture_method: "manual",
      description: description || "PawHomie booking",
      metadata: { bookingId: bk.id, ownerId: bk.owner_id },
      automatic_payment_methods: { enabled: true },
    };

    if (sp?.stripe_account_id && sp?.payouts_enabled) {
      params.application_fee_amount = platformFeeCents;
      params.transfer_data = { destination: sp.stripe_account_id };
    }

    const intent = await stripe.paymentIntents.create(params);
    return new Response(JSON.stringify({ clientSecret: intent.client_secret, id: intent.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return fail((e as Error).message);
  }
});
