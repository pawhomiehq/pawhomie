// =====================================================================
// PawHomie — capture-payment Edge Function
// Captures (releases) a held payment after the stay completes, or cancels
// the hold if the booking is cancelled. The caller must be signed in AND a
// party to the booking behind the payment intent.
//
// Deploy:  supabase functions deploy capture-payment --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, SERVICE_ROLE_KEY
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { paymentIntentId, action } = await req.json();
    if (!paymentIntentId) return fail("Missing paymentIntentId");

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) return fail("Server not configured.", 500);

    // Who is calling?
    const asUser = createClient(url, anonKey, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: ures } = await asUser.auth.getUser();
    const user = ures?.user;
    if (!user) return fail("Please sign in.", 401);

    // Map the intent -> booking -> participants, and check the caller is one.
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const bookingId = intent.metadata?.bookingId;
    if (!bookingId) return fail("Payment is not linked to a booking.");

    const admin = createClient(url, serviceKey);
    const { data: bk } = await admin
      .from("bookings")
      .select("owner_id, sitter_id, sitter:sitter_profiles(profile_id)")
      .eq("id", bookingId)
      .maybeSingle();
    if (!bk) return fail("Booking not found.");
    const sitterUid = (bk as any).sitter?.profile_id;
    if (bk.owner_id !== user.id && sitterUid !== user.id) {
      return fail("You're not part of this booking.", 403);
    }

    let result;
    if (action === "cancel") {
      result = await stripe.paymentIntents.cancel(paymentIntentId);   // release the hold, no charge
    } else {
      result = await stripe.paymentIntents.capture(paymentIntentId);  // actually take the money
    }

    return new Response(JSON.stringify({ status: result.status }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return fail((e as Error).message);
  }
});
