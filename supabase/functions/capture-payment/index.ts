// =====================================================================
// PawHomie — capture-payment Edge Function
// Captures (releases) a held payment after the stay completes,
// or cancels the hold if the booking is cancelled.
//
// Deploy:  supabase functions deploy capture-payment --no-verify-jwt
// =====================================================================

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { paymentIntentId, action } = await req.json();
    if (!paymentIntentId) throw new Error("Missing paymentIntentId");

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
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
