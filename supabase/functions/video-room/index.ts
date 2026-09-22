// =====================================================================
// PawHomie — video-room Edge Function
// Creates a private, short-lived Daily.co video room for a 1:1 intro call.
// The Daily API key lives here on the server, never in the browser.
//
// Deploy: supabase functions deploy video-room --no-verify-jwt
// Secret: DAILY_API_KEY must be set (from daily.co dashboard → Developers)
// =====================================================================

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const apiKey = Deno.env.get("DAILY_API_KEY");
    if (!apiKey) throw new Error("Video calling isn't configured yet.");

    const { conversationId } = await req.json();

    // A stable room name per conversation so both people join the SAME room.
    // (Daily room names must be URL-safe.)
    const safe = String(conversationId || "call").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "call";
    const roomName = "pawhomie-" + safe;

    // Rooms auto-expire 2 hours from now, and are private.
    const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60;

    // Try to fetch the room first; if it exists and hasn't expired, reuse it.
    let room = null;
    const getRes = await fetch("https://api.daily.co/v1/rooms/" + roomName, {
      headers: { "Authorization": "Bearer " + apiKey },
    });
    if (getRes.ok) {
      room = await getRes.json();
    } else {
      // create it
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
      if (!createRes.ok) throw new Error("Could not create the call room: " + (await createRes.text()));
      room = await createRes.json();
    }

    // A meeting token so only invited people can join this private room.
    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ properties: { room_name: roomName, exp: exp } }),
    });
    if (!tokenRes.ok) throw new Error("Could not create the call token: " + (await tokenRes.text()));
    const tokenData = await tokenRes.json();

    return new Response(JSON.stringify({ url: room.url, token: tokenData.token }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
