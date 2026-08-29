// =====================================================================
// PawHomie — create-payment Edge Function
// Creates a Stripe PaymentIntent that AUTHORIZES (holds) the funds.
// The secret key lives here on the server, never in the browser.
//
// Deploy:  supabase functions deploy create-payment --no-verify-jwt
// Secret:  supabase secrets set STRIPE_SECRET_KEY=sk_test_...
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
    const { amount, currency, bookingId, description } = await req.json();

    // amount comes in dollars; Stripe wants the smallest unit (cents)
    const cents = Math.round(Number(amount) * 100);
    if (!cents || cents < 50) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // capture_method: "manual" => AUTHORIZE now, CAPTURE later (after the stay).
    const intent = await stripe.paymentIntents.create({
      amount: cents,
      currency: currency || "cad",
      capture_method: "manual",
      description: description || "PawHomie booking",
      metadata: { bookingId: bookingId || "" },
      automatic_payment_methods: { enabled: true },
    });

    return new Response(JSON.stringify({ clientSecret: intent.client_secret, id: intent.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
