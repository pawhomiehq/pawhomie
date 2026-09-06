// =====================================================================
// PawHomie — notify Edge Function
// Sends a branded email for a booking event, through Resend.
// Looks up the recipient's email from Supabase auth (service role).
//
// Deploy:  supabase functions deploy notify --no-verify-jwt
// Secret:  RESEND_API_KEY must be set (re_...)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BRAND = {
  teal: "#21706F", tealDk: "#14514C", cream: "#FCF7F1", ink: "#22302E",
  muted: "#6E7B78", line: "#EFE7DB", logo: "https://pawhomie.vercel.app/assets/img/logo-email.png",
  site: "https://pawhomie.vercel.app/",
};

function shell(title: string, bodyHtml: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Nunito','Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:22px;overflow:hidden;border:1px solid ${BRAND.line};box-shadow:0 10px 30px rgba(20,81,76,.08);">
<tr><td style="background:${BRAND.teal};padding:24px 30px;text-align:center;"><img src="${BRAND.logo}" alt="PawHomie" height="30" style="height:30px;width:auto;display:inline-block;"></td></tr>
<tr><td style="padding:32px 34px 28px 34px;color:${BRAND.ink};">${bodyHtml}</td></tr>
<tr><td style="background:${BRAND.cream};padding:20px 30px;text-align:center;border-top:1px solid ${BRAND.line};">
<p style="margin:0 0 6px 0;font-size:13px;color:${BRAND.muted};font-weight:700;">PawHomie — trusted pet care in your neighbourhood 🐾</p>
<p style="margin:0;font-size:12px;color:#9AA6A3;">Manage this booking anytime in the PawHomie app.</p>
</td></tr></table>
<p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#B3BCB9;text-align:center;">© PawHomie · Toronto, ON</p>
</td></tr></table></body></html>`;
}

function button(label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center" style="border-radius:16px;background:${BRAND.teal};">
<a href="${BRAND.site}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:800;color:#FFFFFF;text-decoration:none;border-radius:16px;">${label}</a></td></tr></table>`;
}

function h1(t: string){ return `<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:900;color:${BRAND.tealDk};">${t}</h1>`; }
function p(t: string){ return `<p style="margin:0 0 4px 0;font-size:15px;line-height:1.6;color:#40504D;font-weight:600;">${t}</p>`; }

// Build the email for each event type.
function template(kind: string, data: Record<string, string>) {
  const who = data.name || "there";
  switch (kind) {
    case "new_request":
      return { subject: "New booking request 🐾",
        html: shell("New request", h1("You've got a new request!") +
          p(`Hi ${who}, a pet owner would like to book you for ${data.dates || "an upcoming stay"}. Open PawHomie to accept or decline.`) + button("View request")) };
    case "accepted":
      return { subject: "Your booking was accepted! 🎉",
        html: shell("Accepted", h1("You're all set! 🎉") +
          p(`Hi ${who}, great news — your booking for ${data.dates || "your stay"} was accepted. Your card hold is confirmed and you can now message your Paw Homie.`) + button("View booking")) };
    case "declined":
      return { subject: "Booking update",
        html: shell("Declined", h1("About your booking") +
          p(`Hi ${who}, unfortunately your request for ${data.dates || "those dates"} couldn't be accepted this time, and no charge was made. You can easily find another great Paw Homie.`) + button("Find another sitter")) };
    case "completed":
      return { subject: "Hope the stay went well! 🐾",
        html: shell("Completed", h1("Stay complete") +
          p(`Hi ${who}, your booking is marked complete. We'd love if you left a quick review — it helps the whole PawHomie community.`) + button("Leave a review")) };
    case "cancelled":
      return { subject: "Booking cancelled",
        html: shell("Cancelled", h1("Booking cancelled") +
          p(`Hi ${who}, your booking for ${data.dates || "those dates"} has been cancelled and any hold on your card has been released.`) + button("Open PawHomie")) };
    default:
      return { subject: "PawHomie update",
        html: shell("Update", h1("PawHomie") + p("You have an update on your booking.") + button("Open PawHomie")) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { kind, userId, toEmail, name, dates } = await req.json();
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not set");

    // resolve recipient email
    let email = toEmail as string | undefined;
    if (!email && userId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SERVICE_ROLE_KEY") ?? "",
      );
      const { data } = await supabase.auth.admin.getUserById(userId);
      email = data?.user?.email ?? undefined;
    }
    if (!email) throw new Error("No recipient email");

    const { subject, html } = template(kind, { name: name || "", dates: dates || "" });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "PawHomie <noreply@pawhomie.com>", to: [email], subject, html }),
    });
    if (!r.ok) throw new Error("Resend error: " + (await r.text()));

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
