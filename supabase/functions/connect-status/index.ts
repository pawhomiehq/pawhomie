// =====================================================================
// PawHomie — connect-status Edge Function
// Checks whether a sitter finished Stripe onboarding and can receive
// payouts, and saves that to sitter_profiles.payouts_enabled.
//
// Deploy: supabase functions deploy connect-status --no-verify-jwt
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { sitterProfileId } = await req.json();
    if (!sitterProfileId) throw new Error("Missing sitterProfileId");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? "",
    );

    const { data: sp } = await supabase
      .from("sitter_profiles")
      .select("stripe_account_id")
      .eq("id", sitterProfileId)
      .single();

    const accountId = sp?.stripe_account_id as string | null;
    if (!accountId) {
      return new Response(JSON.stringify({ payoutsEnabled: false, hasAccount: false }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const account = await stripe.accounts.retrieve(accountId);
    const enabled = !!account.payouts_enabled && !!account.charges_enabled;

    await supabase
      .from("sitter_profiles")
      .update({ payouts_enabled: enabled })
      .eq("id", sitterProfileId);

    return new Response(JSON.stringify({ payoutsEnabled: enabled, hasAccount: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
