// =====================================================================
// PawHomie — create-payment Edge Function (with auto-split)
// Authorizes (holds) the owner's payment. If the sitter has a connected
// Stripe account, the money is routed to them on capture, minus the
// platform's 10% commission (application fee).
//
// Deploy: supabase functions deploy create-payment --no-verify-jwt
// =====================================================================

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const COMMISSION_RATE = 0.10; // PawHomie keeps 10%

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { amount, currency, bookingId, description, sitterProfileId } = await req.json();

    const cents = Math.round(Number(amount) * 100);
    if (!cents || cents < 50) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const params: any = {
      amount: cents,
      currency: currency || "cad",
      capture_method: "manual",
      description: description || "PawHomie booking",
      metadata: { bookingId: bookingId || "" },
      automatic_payment_methods: { enabled: true },
    };

    if (sitterProfileId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SERVICE_ROLE_KEY") ?? "",
      );
      const { data: sp } = await supabase
        .from("sitter_profiles")
        .select("stripe_account_id, payouts_enabled")
        .eq("id", sitterProfileId)
        .single();

      if (sp?.stripe_account_id && sp?.payouts_enabled) {
        params.application_fee_amount = Math.round(cents * COMMISSION_RATE);
        params.transfer_data = { destination: sp.stripe_account_id };
      }
    }

    const intent = await stripe.paymentIntents.create(params);

    return new Response(JSON.stringify({ clientSecret: intent.client_secret, id: intent.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
