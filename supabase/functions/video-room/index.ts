// =====================================================================
// PawHomie — video-room Edge Function
// Creates a private, short-lived Daily.co video room for a 1:1 intro call.
// The Daily API key lives here on the server, never in the browser.
//
// Security: the caller must be signed in AND be a participant (owner or
// sitter) of the conversation they're asking for a room for. Otherwise no
// token is minted. This runs even though the function is deployed with
// --no-verify-jwt, because we check the JWT ourselves below.
//
// Deploy: supabase functions deploy video-room --no-verify-jwt
// Secrets needed:
//   DAILY_API_KEY       (daily.co dashboard → Developers)
//   SERVICE_ROLE_KEY    (Supabase → Settings → API → service_role)
//   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase;
//   we fall back to them if the custom names aren't set.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function fail(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const apiKey = Deno.env.get("DAILY_API_KEY");
    if (!apiKey) return fail("Video calling isn't configured yet.");

    const { conversationId } = await req.json();
    if (!conversationId) return fail("Missing conversation.");

    // ---- Verify the caller is a participant of this conversation ----------
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization") || "";

    let callerName = "PawHomie user";
    let callerId: string | null = null;
    let otherId: string | null = null;
    // deno-lint-ignore no-explicit-any
    let admin: any = null;

    // Fail closed: without the keys we can't verify the caller, so we refuse
    // rather than mint a token for an unverified request.
    if (!url || !serviceKey || !anonKey) return fail("Server not configured.", 500);
    {
      // who is calling? (from their JWT)
      const asUser = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: ures } = await asUser.auth.getUser();
      const user = ures?.user;
      if (!user) return fail("Please sign in to start a call.", 401);
      callerId = user.id;

      // is this conversation theirs? (service role bypasses RLS for the check)
      admin = createClient(url, serviceKey);
      const { data: conv, error: convErr } = await admin
        .from("conversations")
        .select("owner_id, sitter_id")
        .eq("id", conversationId)
        .maybeSingle();
      if (convErr) return fail("Could not verify the conversation.");
      if (!conv || (conv.owner_id !== user.id && conv.sitter_id !== user.id)) {
        return fail("You're not part of this conversation.", 403);
      }
      otherId = conv.owner_id === user.id ? conv.sitter_id : conv.owner_id;

      // a friendly name for the Daily tile
      const { data: prof } = await admin
        .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (prof?.full_name) callerName = prof.full_name;
    }

    // ---- Create/reuse the Daily room ------------------------------------
    // A stable room name per conversation so both people join the SAME room.
    const safe = String(conversationId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "call";
    const roomName = "pawhomie-" + safe;

    // Rooms auto-expire 2 hours from now, and are private.
    const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60;

    let room = null;
    let justCreated = false;
    const getRes = await fetch("https://api.daily.co/v1/rooms/" + roomName, {
      headers: { "Authorization": "Bearer " + apiKey },
    });
    if (getRes.ok) {
      room = await getRes.json();
    } else {
      justCreated = true;
      const createRes = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName,
          privacy: "private",
          properties: {
            exp: exp,
            max_participants: 2,
            enable_chat: false,
            enable_screenshare: false,
            start_video_off: false,
            start_audio_off: false,
            eject_at_room_exp: true,
          },
        }),
      });
      if (!createRes.ok) return fail("Could not create the call room: " + (await createRes.text()));
      room = await createRes.json();
    }

    // A meeting token so only invited people can join this private room.
    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ properties: { room_name: roomName, exp: exp, user_name: callerName, eject_at_token_exp: true } }),
    });
    if (!tokenRes.ok) return fail("Could not create the call token: " + (await tokenRes.text()));
    const tokenData = await tokenRes.json();

    // ---- Ring the other person, once, when the call first starts ----------
    // Only on room creation: the first caller creates the room, the second
    // reuses it — so the person who joins after being rung doesn't re-ring back.
    if (justCreated && admin && callerId && otherId) {
      const first = (callerName || "Someone").split(" ")[0];
      const MARK = "​📹​"; // must match window.CALL_MARKER in the client
      // in-thread banner (delivered live via Realtime to anyone watching the chat)
      await admin.from("messages").insert({
        conversation_id: conversationId,
        sender_id: callerId,
        body: MARK + first + " started a video call — tap “Video call” above to join.",
      });
      // notification (shows in their bell even if the chat is closed)
      await admin.from("notifications").insert({
        profile_id: otherId,
        title: "📹 Incoming video call",
        body: first + " is calling you on PawHomie. Open the chat and tap “Video call” to join.",
      });
    }

    return new Response(JSON.stringify({ url: room.url, token: tokenData.token }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return fail((e as Error).message);
  }
});
