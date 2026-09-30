// =====================================================================
// PawHomie — connect-onboarding Edge Function
// Creates (or reuses) a sitter's Stripe Connect account and returns a
// hosted onboarding link where they enter their bank + ID details.
//
// Deploy: supabase functions deploy connect-onboarding --no-verify-jwt
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
    const { sitterProfileId, email, returnUrl } = await req.json();
    if (!sitterProfileId) throw new Error("Missing sitterProfileId");

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (!url || !serviceKey || !anonKey) throw new Error("Server not configured.");

    // The caller must be signed in and own this sitter profile — otherwise an
    // attacker could attach their own bank details to someone else's payouts.
    const asUser = createClient(url, anonKey, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: ures } = await asUser.auth.getUser();
    const user = ures?.user;
    if (!user) throw new Error("Please sign in.");

    // service-role client so we can read/write the sitter's stripe id
    const supabase = createClient(url, serviceKey);

    // find any existing connected account for this sitter (and verify ownership)
    const { data: sp } = await supabase
      .from("sitter_profiles")
      .select("stripe_account_id, profile_id")
      .eq("id", sitterProfileId)
      .single();
    if (!sp || sp.profile_id !== user.id) throw new Error("You can't set up payouts for this profile.");

    let accountId = sp?.stripe_account_id as string | null;

    // create the account if they don't have one yet
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "CA",
        email: email || undefined,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: "individual",
        metadata: { sitterProfileId },
      });
      accountId = account.id;
      await supabase
        .from("sitter_profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", sitterProfileId);
    }

    // create a fresh onboarding link
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: returnUrl || "https://pawhomie.vercel.app/",
      return_url: returnUrl || "https://pawhomie.vercel.app/",
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: link.url, accountId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
