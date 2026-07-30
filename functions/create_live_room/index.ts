// Supabase Edge Function: create_live_room (using live_provider adapter)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, createRoom, sessionRoomExp } from "../live_provider/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // 1) Auth
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const authed = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: u, error: uErr } = await authed.auth.getUser();
    if (uErr || !u?.user) return json({ error: "Unauthorized" }, 401);
    const callerId = u.user.id;

    // 2) Input
    const body = await req.json();
    const { session_id, title = "Live Session" } = body ?? {};
    if (!session_id) return json({ error: "Missing session_id" }, 400);

    // 3) Load session
    const { data: s, error: sErr } = await admin
      .from("app_session")
      .select("id, host_id, live_provider, live_room_id, start_time, duration_minutes")
      .eq("id", session_id)
      .single();
    if (sErr || !s) return json({ error: "Session not found" }, 404);

    // 4) Authorization: only host can create the room
    if (s.host_id !== callerId) return json({ error: "Forbidden: not host" }, 403);

    const activeProvider = provider();

    // 5) Reuse existing room if already created for the same provider
    if (s.live_room_id && s.live_provider === activeProvider) {
      return json({ live_provider: s.live_provider, live_room_id: s.live_room_id, reused: true });
    }

    // 6) Create room via adapter — same expiry math as the precreate cron
    // and the issue_join_token fallback, so all three provisioning paths
    // produce identical rooms.
    const { roomId } = await createRoom(title, {
      expUnix: sessionRoomExp(s.start_time, s.duration_minutes),
    });

    // 7) Persist on session (race-guarded like the other paths; if another
    // path won, the re-read below would be needed — host UI treats reused
    // rooms via step 5, so a lost race here simply returns the fresh read)
    const { error: upErr } = await admin
      .from("app_session")
      .update({ live_provider: activeProvider, live_room_id: roomId })
      .eq("id", session_id)
      .is("live_room_id", null);
    if (upErr) return json({ error: "DB update failed", detail: upErr.message }, 500);

    // 8) Re-read and return the PERSISTED room: if a concurrent provisioner
    // won the race, its room is the real one and ours simply expires.
    // Returning our roomId blindly would hand the host a room nobody else
    // is directed to.
    const { data: s2 } = await admin
      .from("app_session")
      .select("live_provider, live_room_id")
      .eq("id", session_id)
      .single();
    const finalRoom = s2?.live_room_id ?? roomId;
    return json({
      live_provider: s2?.live_provider ?? activeProvider,
      live_room_id: finalRoom,
      reused: finalRoom !== roomId,
    });
  } catch (e) {
    return json({ error: "Unhandled exception", detail: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
