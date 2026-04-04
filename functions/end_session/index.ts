// Supabase Edge Function: end_session
// Ends a session (host-only), sets ended_at, and writes a rich session_ended feed event.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Env
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Clients
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
    // 1) Auth: must include a valid JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ code: 401, message: "Missing authorization header" }, 401);

    const jwt = authHeader.replace("Bearer ", "").trim();
    const caller = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: u, error: uErr } = await caller.auth.getUser();
    if (uErr || !u?.user) return json({ code: 401, message: "Invalid or expired JWT" }, 401);
    const callerId = u.user.id;

    // 2) Parse input
    const { session_id } = await req.json();
    if (!session_id) return json({ code: 400, message: "Missing session_id" }, 400);

    // 3) Verify session + ownership
    const { data: s, error: sErr } = await admin
      .from("app_session")
      .select("id, host_id, status")
      .eq("id", session_id)
      .single();
    if (sErr || !s) return json({ code: 404, message: "Session not found" }, 404);
    if (s.host_id !== callerId) return json({ code: 403, message: "Forbidden - Not host" }, 403);
    if (s.status === "ended") {
      return json({ message: "Session already ended" });
    }

    // 4) End the session
    const now = new Date().toISOString();
    const { error: upErr } = await admin
      .from("app_session")
      .update({ status: "ended", ended_at: now })
      .eq("id", session_id);
    if (upErr) return json({ code: 500, message: "Failed to update session", detail: upErr.message }, 500);

    // 5) Pull overview to enrich metadata (duration, net, attendees, title)
    const { data: ov } = await admin
      .from("app_session_overview")
      .select("title, duration_min, net, attendees")
      .eq("session_id", session_id)
      .single();

    const meta = {
      ended_at: now,
      title: ov?.title ?? null,
      duration_min: ov?.duration_min ?? null,
      net_earned: ov?.net ?? null,
      attendees: ov?.attendees ?? null,
    };

    // 6) Insert feed event (session_ended)
    const { error: feedErr } = await admin.from("app_feed_event").insert({
      type: "session_ended",
      actor_id: callerId,
      session_id,
      metadata: meta,
    });
    if (feedErr) console.error("Feed insert failed:", feedErr);

    return json({ message: "Session successfully ended", session_id, ended_at: now, metadata: meta });
  } catch (e) {
    console.error("Unhandled error:", e);
    return json({ code: 500, message: "Unhandled error", detail: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
